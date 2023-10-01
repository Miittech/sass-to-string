const fs = require("fs-extra");
const path = require("path");
const sass = require("sass");


let config = {};
try {
  // Requesting the file to be at the root of the project
  // eslint-disable-next-line
  config = require(`${process.cwd()}/.sass-to-string.js`);
} catch (e) {
  console.error(
    "sass-to-string encountered an error loading the config file. Falling back on the default config",
    {
      e,
    }
  );
} finally {
  config = {
    src: "src",
    dist: "dist",
    prepare: (scss) => scss,
    ...config,
  };
}

const cliArgs = process.argv.slice(2);
cliArgs.forEach((arg) => {
  const [key, value] = arg.split("=");
  config[key.replace("--", "")] = value;
});

const srcDirectory = config.src;
const isVerbose = "verbose" in config;

const log = (content) => {
  if (!isVerbose) {
    return;
  }

  console.log(`sass-to-string: ${content}`);
};

const replaceLast = function (content, search, replacement) {
  const parts = content.split(search);
  const lastOccurence = parts.pop();
  return `${parts.join(search)}${replacement}${lastOccurence}`;
};

const transformSassFilesToEsModules = (directoryToSearch, pattern) => {
  readdirSync(directoryToSearch).forEach((subDirectory) => {
    const subDirectoryToSearch = resolve(directoryToSearch, subDirectory);

    const stat = statSync(subDirectoryToSearch);
    if (stat.isDirectory()) {
      transformSassFilesToEsModules(subDirectoryToSearch, pattern);
    }

    if (stat.isFile() && subDirectoryToSearch.endsWith(pattern)) {
      log(`Reading file ${subDirectory}`);
      console.log(`Reading file ${subDirectory}`);

      const fileContent = readFileSync(subDirectoryToSearch).toString();
      const data = config.prepare(fileContent);
      const result = renderSync({
        data,
      })
        .css.toString();

      console.log(`fileContent: ${fileContent}`);

      const distDirectory = config.dist;
      const computedPath = resolve(
        __dirname,
        distDirectory,
        `${replaceLast(
          subDirectoryToSearch,
          `/${srcDirectory}/`,
          `/${distDirectory}/`
        )}.js`
      );

      console.log(`disDirectory: ${distDirectory}`);
      console.log(`computedPath: ${computedPath}`);

      const content = `const styles = \`${result}\`; export default styles;`;
      console.log(content);

      outputFile(computedPath, content, (error) => {
        if (error) {
          console.error({ error });
        } else {
          log
            (`Successfully created ${subDirectory}.js in ${computedPath}`);
        }
      });
    }
  });
};

transformSassFilesToEsModules(`./${srcDirectory}`, ".scss");
