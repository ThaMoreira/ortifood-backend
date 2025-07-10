import dbConnect from "./dbConnect.js";
import User from "./models/User.js";
import bcrypt from "bcrypt";

export default async function handler(req, res) {
  const allowedOrigins = ["http://127.0.0.1:5500", "https://ortifood.vercel.app"];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  await dbConnect();

  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email e senha são obrigatórios" });

  const existingUser = await User.findOne({ email });

  if (existingUser)
    return res.status(400).json({ error: "Usuário já existe" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = new User({ email, passwordHash });
  await user.save();

  res.status(201).json({ message: "Usuário criado com sucesso" });
}