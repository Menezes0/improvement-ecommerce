import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Informe um e-mail válido.'),
  password: z.string().min(1, 'A senha é obrigatória.'),
});

export const cadastroSchema = z.object({
  nome: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres.'),
  email: z.string().email('Informe um e-mail válido.'),
  telefone: z.string().min(10, 'Informe um telefone válido com DDD (ex: 69992010001).'),
  password: z.string().min(8, 'A senha deve conter no mínimo 8 caracteres (RNF01, RF01).'),
});

export const produtoSchema = z.object({
  nome: z.string().min(2, 'O nome do produto é obrigatório.'),
  marca: z.string().min(1, 'A marca é obrigatória.'),
  categoria_id: z.string().uuid('Selecione uma categoria válida.'),
  preco: z.coerce.number().min(0.01, 'O preço deve ser maior que zero (CA25).'),
  estoque: z.coerce.number().int().min(0, 'O estoque não pode ser negativo.'),
  descricao: z.string().optional(),
  sem_lactose: z.boolean().default(false),
  sem_gluten: z.boolean().default(false),
  vegano: z.boolean().default(false),
});

export const ajusteEstoqueSchema = z.object({
  tipo: z.enum(['entrada', 'saida', 'ajuste']),
  quantidade: z.coerce.number().int().positive('A quantidade deve ser maior que zero.'),
  motivo: z.string().min(3, 'Informe o motivo do ajuste.'),
});

export const ofertaSchema = z.object({
  produto_id: z.string().uuid(),
  preco_promocional: z.coerce.number().positive('Preço promocional deve ser positivo.'),
  inicio: z.string(),
  fim: z.string(),
});
