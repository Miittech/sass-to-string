module.exports = {
  verbose: true,
  prepare: (scss) =>
    scss.replace(/@import "bootstrap/g, `@import "node_modules/bootstrap`),
};
