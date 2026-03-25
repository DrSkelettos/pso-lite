# Tech Stack
* Eleventy
* Bootstrap 5
* HTML 5
* JavaScript

# Project Structure
* ./example-data/ - Example data files
* ./_includes/ - HTML templates
* ./_site/ - Built site (ignore all but /src)
* ./_site/src - JavaScript source files
* ./sites/ - HTML source files
* ./index.html - Entry point

# General Rules
* Edit HTML sites only in ./sites/, never in ./_site/
* Write JavaScript code into explicit JS files in ./_site/src/ whenever suitable, try to keep inline JavaScript to a minimum