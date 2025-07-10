import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:5500");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());

const PORT = process.env.PORT || 3000;
const MONGO_URI =
  process.env.MONGO_URI || "";

const JWT_SECRET = process.env.JWT_SECRET || "segredo_super_secreto";

console.log(process.env.MONGO_URI)
// Conecta ao MongoDB
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB conectado"))
  .catch((err) => console.log(err));

// Schema e modelo de usuário
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  passwordHash: String,
});
const User = mongoose.model("User", userSchema);

// Rota cadastro
app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res
      .status(400)
      .json({ error: "Email e senha são obrigatórios" });

  const existingUser = await User.findOne({ email });
  if (existingUser)
    return res.status(400).json({ error: "Usuário já existe" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = new User({ email, passwordHash });
  await user.save();

  res.status(201).json({ message: "Usuário criado com sucesso" });
});

// Rota login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user)
    return res.status(400).json({ error: "Usuário ou senha inválidos" });

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid)
    return res.status(400).json({ error: "Usuário ou senha inválidos" });

  const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
    expiresIn: "1h",
  });

  res.json({ token });
});

// Rota protegida
app.get("/api/protected", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ error: "Token não fornecido" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ message: "Conteúdo protegido", user: decoded });
  } catch (e) {
    res.status(401).json({ error: "Token inválido" });
  }
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));