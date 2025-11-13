module.exports = function(eleventyConfig) {
  // Ignore these directories and files from Eleventy processing
  eleventyConfig.ignores.add(".windsurf/");
  eleventyConfig.ignores.add("openspec/");
  eleventyConfig.ignores.add("node_modules/");
  eleventyConfig.ignores.add("AGENTS.md");
};
