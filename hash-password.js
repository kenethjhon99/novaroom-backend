import bcrypt from "bcryptjs";

const password = "Admin12345";
const hash = await bcrypt.hash(password, 10);

console.log(hash);