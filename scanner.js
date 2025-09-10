const fs = require("fs");
const path = require("path");

// Lista constante de paquetes a buscar con versiones específicas
const PACKAGES_TO_SCAN = [
  { name: "ansi-regex", version: "6.2.1" },
  { name: "ansi-styles", version: "6.2.2" },
  { name: "backslash", version: "0.2.1" },
  { name: "chalk-template", version: "1.1.1" },
  { name: "chalk", version: "5.6.1" },
  { name: "color-convert", version: "3.1.1" },
  { name: "color-name", version: "2.0.1" },
  { name: "color-string", version: "2.1.1" },
  { name: "color", version: "5.0.1" },
  { name: "@coveops/abi", version: "2.0.1" },
  { name: "debug", version: "4.4.2" },
  { name: "@duckdb/duckdb-wasm", version: "1.29.2" },
  { name: "@duckdb/node-api", version: "1.3.3" },
  { name: "@duckdb/node-bindings", version: "1.3.3" },
  { name: "duckdb", version: "1.3.3" },
  { name: "has-ansi", version: "6.0.1" },
  { name: "is-arrayish", version: "0.3.3" },
  { name: "prebid", version: "10.9.1" },
  { name: "prebid", version: "10.9.2" },
  { name: "simple-swizzle", version: "0.2.3" },
  { name: "slice-ansi", version: "7.1.1" },
  { name: "strip-ansi", version: "7.1.1" },
  { name: "supports-color", version: "10.2.1" },
  { name: "supports-hyperlinks", version: "4.1.1" },
  { name: "wrap-ansi", version: "9.0.1" },
];

class SimpleNPMScanner {
  constructor() {
    this.found = [];
  }

  findNodeModules(startPath, maxDepth = 10, currentDepth = 0) {
    const results = [];

    if (currentDepth > maxDepth) return results;

    try {
      const items = fs.readdirSync(startPath);

      for (const item of items) {
        if (item.startsWith(".") || item === "dist" || item === "build")
          continue;

        const fullPath = path.join(startPath, item);

        try {
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            if (item === "node_modules") {
              results.push(fullPath);
              // console.log(`📁 Encontrado node_modules: ${fullPath}`);
            } else if (currentDepth < maxDepth) {
              results.push(
                ...this.findNodeModules(fullPath, maxDepth, currentDepth + 1)
              );
            }
          }
        } catch (error) {
          // Ignorar errores de permisos
        }
      }
    } catch (error) {
      console.warn(`⚠️ No se puede acceder a: ${startPath}`);
    }

    return results;
  }

  searchPackages(startPath = process.cwd()) {
    console.log(`📍 Buscando paquetes en: ${startPath}`);
    console.log("");

    const nodeModulesDirs = this.findNodeModules(startPath);

    if (nodeModulesDirs.length === 0) {
      console.log("❌ No se encontraron directorios node_modules");
      return [];
    }

    console.log("");

    PACKAGES_TO_SCAN.forEach(({ name, version }) => {
      // console.log(`🔍 Buscando: ${name}@${version}`);
      nodeModulesDirs.forEach((nodeModulesPath) => {
        this.checkPackageInNodeModules(nodeModulesPath, name, version);
      });
      this.showResults(name, version);
      this.found = []; // Resetear para el siguiente paquete
    });

    return this.found;
  }

  checkPackageInNodeModules(nodeModulesPath, packageName, version) {
    let packagePath;

    if (packageName.startsWith("@") && packageName.includes("/")) {
      packagePath = path.join(nodeModulesPath, packageName);
    } else {
      packagePath = path.join(nodeModulesPath, packageName);
    }

    // console.log(`🔎 Revisando: ${packagePath}`);

    if (fs.existsSync(packagePath)) {
      const packageJsonPath = path.join(packagePath, "package.json");

      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(
            fs.readFileSync(packageJsonPath, "utf8")
          );
          const installedVersion = packageJson.version;

          // Verificar si la versión coincide exactamente
          if (installedVersion === version) {
            this.found.push({
              name: packageName,
              version: installedVersion,
              path: packagePath,
            });

            console.log(
              `🚨🚨🚨  ENCONTRADO: ${packageName}@${installedVersion}`
            );
            console.log(`   📍 Ruta: ${packagePath}`);
          } else {
            // console.log(
            //   `⚠️ Encontrado ${packageName}@${installedVersion} (buscabas versión ${version})`
            // );
            // console.log(`   📍 Ruta: ${packagePath}`);
          }
        } catch (error) {
          console.log(`❌ Error leyendo package.json en ${packagePath}`);
        }
      } else {
        console.log(`⚠️ Carpeta ${packageName} existe pero sin package.json`);
      }
    }
  }

  showResults(packageName, version) {
    if (this.found.length > 0) {
      console.log(
        `❌ Encontradas ${this.found.length} instalación(es) de ${packageName}:`
      );
    } else {
      // Not f
      // console(` ✅ NO se encontró ${packageName}@${version}`);
    }
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  let searchPath = process.cwd();

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--path" || args[i] === "-p") {
      searchPath = args[i + 1];
      i++;
    }
  }

  if (!fs.existsSync(searchPath)) {
    console.log(`❌ El directorio no existe: ${searchPath}`);
    process.exit(1);
  }

  const scanner = new SimpleNPMScanner();
  scanner.searchPackages(searchPath);
  if (!scanner.found.length)
    console.log("✅ No se encontraron paquetes afectados");
}
