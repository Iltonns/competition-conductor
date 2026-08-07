#!/usr/bin/env node
/**
 * Executa a matriz de verificacao de isolamento (supabase/tests/*.sql).
 *
 * P1 do PRD_FECHAMENTO_FINAL_PRODUCAO.md. Pode rodar contra o banco de
 * producao porque todo script da pasta e seguro por construcao: ou e
 * transacional terminando em ROLLBACK, ou e somente leitura. Este runner
 * revalida essa propriedade antes de executar qualquer coisa e aborta se
 * algum arquivo deixar de respeita-la.
 *
 * Conexao: variavel SUPABASE_DB_URL (ambiente ou .env). Nunca e impressa.
 * Executor: driver pg, direto do Node. Sem psql e sem Docker, para que a
 * verificacao nao dependa de daemon local nem de binario no PATH.
 *
 *   node scripts/run-rls-matrix.mjs            # todos os scripts
 *   node scripts/run-rls-matrix.mjs 2a phase5  # so os que casam com o filtro
 */
import { readFileSync, readdirSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import pg from "pg";

/** Commit que produziu a evidencia. Marca a arvore suja para nao enganar. */
function commitAtual() {
  try {
    const hash = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
    const sujo = execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim();
    return sujo ? `${hash} (arvore com alteracoes nao commitadas)` : hash;
  } catch {
    return "desconhecido (git indisponivel)";
  }
}

const DIR_TESTES = "supabase/tests";
const DIR_SAIDA = "docs/closure/p1-matriz-rls";

function conexao() {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL;
  if (!existsSync(".env")) return null;
  for (const linha of readFileSync(".env", "utf8").split(/\r?\n/)) {
    if (linha.startsWith("#") || !linha.includes("=")) continue;
    const i = linha.indexOf("=");
    if (linha.slice(0, i).trim() === "SUPABASE_DB_URL") {
      return linha
        .slice(i + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
    }
  }
  return null;
}

/** Remove comentarios e corpos plpgsql para nao confundir texto com statement. */
function limpar(sql) {
  return sql
    .replace(/\$(\w*)\$[\s\S]*?\$\1\$/g, " CORPO ")
    .replace(/--[^\n]*/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ");
}

const ESCRITA =
  /\b(INSERT\s+INTO|UPDATE\s+\w|DELETE\s+FROM|CREATE\s+(TABLE|FUNCTION|POLICY|INDEX)|ALTER\s+TABLE|DROP\s+(TABLE|FUNCTION|POLICY))\b/i;

/** Um script so pode rodar em producao se nao deixar residuo. */
function auditarSeguranca(caminho) {
  const bruto = readFileSync(caminho, "utf8");
  const sql = limpar(bruto);
  const controle = [...sql.matchAll(/\b(BEGIN|COMMIT|ROLLBACK)\s*;/gi)].map((m) =>
    m[1].toUpperCase(),
  );
  const temCommit = controle.includes("COMMIT");
  const abre = controle.filter((c) => c === "BEGIN").length;
  const ultimo = controle[controle.length - 1] ?? null;
  const escreve = ESCRITA.test(bruto);

  if (temCommit) return { seguro: false, motivo: "contem COMMIT" };
  if (abre === 0 && !escreve) return { seguro: true, motivo: "somente leitura" };
  if (abre === 0 && escreve) return { seguro: false, motivo: "escreve fora de transacao" };
  if (ultimo !== "ROLLBACK") return { seguro: false, motivo: "nao termina em ROLLBACK" };
  return { seguro: true, motivo: "transacional com ROLLBACK" };
}

/**
 * Cada script roda numa conexao propria e descartavel. Assim um ROLLBACK ou
 * um erro em um arquivo nao contamina o estado de sessao do seguinte.
 */
async function executar(url, caminho) {
  const cliente = new pg.Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    application_name: "is-arena-matriz-rls",
  });
  const sql = readFileSync(caminho, "utf8");
  try {
    await cliente.connect();
    const resultados = await cliente.query(sql);
    const linhas = (Array.isArray(resultados) ? resultados : [resultados])
      .filter((r) => r?.rows?.length)
      .map((r) => JSON.stringify(r.rows));
    return { ok: true, saida: linhas.join("\n") || "(sem linhas de retorno)" };
  } catch (erro) {
    const partes = [
      `ERRO: ${erro.message}`,
      erro.code ? `codigo: ${erro.code}` : null,
      erro.detail ? `detalhe: ${erro.detail}` : null,
      erro.hint ? `dica: ${erro.hint}` : null,
      erro.where ? `contexto: ${erro.where}` : null,
    ].filter(Boolean);
    return { ok: false, saida: partes.join("\n") };
  } finally {
    // Se o script abriu transacao e morreu antes do ROLLBACK, encerrar a
    // conexao ja descarta tudo: o Postgres nao promove transacao aberta.
    await cliente.end().catch(() => {});
  }
}

const url = conexao();
if (!url) {
  console.error(
    "SUPABASE_DB_URL nao definida.\n" +
      "Defina no .env (que ja e ignorado pelo git) ou no ambiente.\n" +
      "Dashboard > Project Settings > Database > Connection string (URI).",
  );
  process.exit(2);
}

const filtros = process.argv.slice(2);
const arquivos = readdirSync(DIR_TESTES)
  .filter((f) => f.endsWith(".sql"))
  .filter((f) => !filtros.length || filtros.some((t) => f.includes(t)))
  .sort();

console.log(`Auditando ${arquivos.length} script(s) antes de executar...\n`);
const auditoria = [];
const inseguros = [];
for (const f of arquivos) {
  const a = auditarSeguranca(join(DIR_TESTES, f));
  auditoria.push({ f, ...a });
  if (!a.seguro) inseguros.push({ f, motivo: a.motivo });
}
if (inseguros.length) {
  console.error("ABORTADO: script(s) que deixariam residuo em producao:\n");
  for (const i of inseguros) console.error(`  ${i.f} - ${i.motivo}`);
  process.exit(3);
}
console.log("Todos seguros: transacionais com ROLLBACK ou somente leitura.\n");

console.log("Executor: driver pg (sem psql, sem Docker)\n");

mkdirSync(DIR_SAIDA, { recursive: true });
const resultados = [];
for (const f of arquivos) {
  process.stdout.write(f.padEnd(56));
  const r = await executar(url, join(DIR_TESTES, f));
  resultados.push({ f, ok: r.ok, saida: r.saida });
  writeFileSync(join(DIR_SAIDA, f.replace(/\.sql$/, ".log")), r.saida + "\n", "utf8");
  console.log(r.ok ? "PASSOU" : "FALHOU");
  if (!r.ok) console.log("  " + r.saida.split("\n").join("\n  "));
}

const falhas = resultados.filter((r) => !r.ok);

// Evidencia duravel. Os .log por script caem no *.log do .gitignore, que existe
// para ruido de build — entao a evidencia que o PRD exige (saida de cada script,
// hash do commit, data) e escrita tambem aqui, em arquivo versionado.
if (!filtros.length) {
  const evidencia = [
    "# Evidência — matriz de isolamento",
    "",
    "Gerado por `npm run test:rls`. Não editar à mão: é sobrescrito a cada execução.",
    "",
    `- **Data:** ${new Date().toISOString()}`,
    `- **Commit:** \`${commitAtual()}\``,
    `- **Resultado:** ${resultados.length - falhas.length}/${resultados.length}`,
    "",
    "## Conferência de segurança, arquivo por arquivo",
    "",
    "Refeita a cada execução. O runner aborta antes de conectar se algum script",
    "deixar de terminar em `ROLLBACK` ou de ser somente leitura.",
    "",
    "| Script | Classificação |",
    "| --- | --- |",
    ...auditoria.map((a) => `| \`${a.f}\` | ${a.motivo} |`),
    "",
    "## Saída por script",
    "",
    ...resultados.flatMap((r) => [
      `### ${r.ok ? "PASSOU" : "FALHOU"} — \`${r.f}\``,
      "",
      "```",
      r.saida,
      "```",
      "",
    ]),
  ].join("\n");
  writeFileSync(join(DIR_SAIDA, "EVIDENCIA.md"), evidencia, "utf8");
}

console.log(
  `\n${resultados.length - falhas.length}/${resultados.length} passaram. ` +
    `Logs em ${DIR_SAIDA}/`,
);
if (!filtros.length) console.log(`Evidencia em ${DIR_SAIDA}/EVIDENCIA.md`);
if (falhas.length) {
  console.log("\nFalharam:");
  for (const r of falhas) console.log(`  ${r.f}`);
}
process.exit(falhas.length ? 1 : 0);
