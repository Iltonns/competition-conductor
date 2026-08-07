#!/usr/bin/env node
/**
 * Aponta core.hooksPath para .githooks, que e versionado.
 *
 * Roda sozinho no `npm install` (script `prepare`), para que quem clonar o
 * repositorio receba o hook de pre-push sem precisar lembrar de habilitar.
 *
 * Falha em silencio onde nao ha git: instalar dependencia nao pode quebrar por
 * causa de hook.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

// Em worktree o .git e arquivo, nao diretorio; existsSync cobre os dois.
if (!existsSync(".git")) process.exit(0);

try {
  execFileSync("git", ["config", "core.hooksPath", ".githooks"], { stdio: "ignore" });
} catch {
  console.warn(
    "Nao foi possivel apontar core.hooksPath para .githooks.\n" +
      "O hook de pre-push nao vai rodar. Para habilitar a mao:\n" +
      "  git config core.hooksPath .githooks",
  );
}
