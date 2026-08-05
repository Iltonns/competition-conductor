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
 * Executor: psql do PATH; se ausente, psql via imagem Docker do Postgres.
 *
 *   node scripts/run-rls-matrix.mjs            # todos os scripts
 *   node scripts/run-rls-matrix.mjs 2a phase5  # so os que casam com o filtro
 */
import { readFileSync, readdirSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const DIR_TESTES = "supabase/tests";
const DIR_SAIDA = "docs/closure/p1-matriz-rls";
const IMAGEM_PG = "public.ecr.aws/supabase/postgres:17.6.1.141";

function conexao() {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL;
  if (!existsSync(".env")) return null;
  for (const linha of readFileSync(".env", "utf8").split(/\r?\n/)) {
    if (linha.startsWith("#") || !linha.includes("=")) continue;
    const i = linha.indexOf("=");
    if (linha.slice(0, i).trim() === "SUPABASE_DB_URL") {
      return linha.slice(i + 1).trim().replace(/^["']|["']$/g, "");
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

function temPsqlLocal() {
  const r = spawnSync("psql", ["--version"], { encoding: "utf8", shell: true });
  return r.status === 0;
}

function executar(url, caminhoRelativo, usarDocker) {
  const args = usarDocker
    ? [
        "run", "--rm", "-i",
        "-v", `${resolve(DIR_TESTES)}:/tests:ro`,
        IMAGEM_PG,
        "psql", url, "-v", "ON_ERROR_STOP=1", "-X", "-q",
        "-f", `/tests/${caminhoRelativo}`,
      ]
    : [url, "-v", "ON_ERROR_STOP=1", "-X", "-q", "-f", join(DIR_TESTES, caminhoRelativo)];

  const r = spawnSync(usarDocker ? "docker" : "psql", args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return {
    status: r.status,
    saida: [r.stdout ?? "", r.stderr ?? ""].join("").trim(),
  };
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
const inseguros = [];
for (const f of arquivos) {
  const a = auditarSeguranca(join(DIR_TESTES, f));
  if (!a.seguro) inseguros.push({ f, motivo: a.motivo });
}
if (inseguros.length) {
  console.error("ABORTADO: script(s) que deixariam residuo em producao:\n");
  for (const i of inseguros) console.error(`  ${i.f} - ${i.motivo}`);
  process.exit(3);
}
console.log("Todos seguros: transacionais com ROLLBACK ou somente leitura.\n");

const usarDocker = !temPsqlLocal();
console.log(`Executor: ${usarDocker ? "psql via Docker" : "psql local"}\n`);

mkdirSync(DIR_SAIDA, { recursive: true });
const resultados = [];
for (const f of arquivos) {
  process.stdout.write(f.padEnd(56));
  const r = executar(url, f, usarDocker);
  const ok = r.status === 0;
  resultados.push({ f, ok, saida: r.saida });
  writeFileSync(join(DIR_SAIDA, f.replace(/\.sql$/, ".log")), r.saida + "\n", "utf8");
  console.log(ok ? "PASSOU" : "FALHOU");
  if (!ok) console.log("  " + r.saida.split("\n").slice(-6).join("\n  "));
}

const falhas = resultados.filter((r) => !r.ok);
console.log(
  `\n${resultados.length - falhas.length}/${resultados.length} passaram. ` +
    `Logs em ${DIR_SAIDA}/`,
);
if (falhas.length) {
  console.log("\nFalharam:");
  for (const r of falhas) console.log(`  ${r.f}`);
}
process.exit(falhas.length ? 1 : 0);
