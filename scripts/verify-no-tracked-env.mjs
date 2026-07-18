import { execFileSync } from "node:child_process";

const trackedFiles = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean);

const trackedEnvironmentFiles = trackedFiles.filter((file) => {
  const name = file.split("/").at(-1) ?? file;
  return (name === ".env" || name.startsWith(".env.")) && name !== ".env.example";
});

if (trackedEnvironmentFiles.length > 0) {
  console.error("Arquivos de ambiente versionados:", trackedEnvironmentFiles.join(", "));
  process.exit(1);
}

console.log("OK: nenhum arquivo de ambiente com valores está versionado.");
