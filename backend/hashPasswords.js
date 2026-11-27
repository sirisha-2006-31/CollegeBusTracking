const bcrypt = require("bcrypt");

async function main() {
    const johnhash = await bcrypt.hash("John@123", 10);
    const lillyhash = await bcrypt.hash("Lilly@123", 10);
    const spoorthyhash = await bcrypt.hash("Spoorthy@123", 10);
    console.log("john:", johnhash);
    console.log("lilly:", lillyhash);
    console.log("spoorthy:", spoorthyhash);
}

main();