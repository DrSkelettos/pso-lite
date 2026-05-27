next let's create the actual waitlist file. we should create a waitlist.js (src/station) file with the necessary code. take a look at e.g. belegung/index.html to see how we structure code. 

we need to create two parts:

# 1. waitlist display
the waitlist should be a table of waitlist patient entries. it should contain the following information (one column each)
* name (last name, first name (gender as M/W/D))
* date of birth
* insurance information (column should have "L0/L1" as header, content will be text, should be colored red)
* type (empty by default, "teilstationär" (color red) in some cases)
* 