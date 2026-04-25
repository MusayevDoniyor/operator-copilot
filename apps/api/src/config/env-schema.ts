import * as Joi from 'joi';

export const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'provision')
    .default('development'),
  PORT: Joi.number().default(3001),
  FRONTEND_URL: Joi.string().default('http://localhost:3000'),
  JWT_SECRET: Joi.string().required().description('JWT secret for signing tokens'),
  JWT_EXPIRES_IN: Joi.string().default('24h'),
  GEMINI_API_KEY: Joi.string().required().description('Google Gemini API key'),
  // Hardcoded users for demo - in production use DB
  ADMIN_USERNAME: Joi.string().default('admin'),
  ADMIN_PASSWORD: Joi.string().default('admin123'),
});

export type EnvConfig = {
  NODE_ENV: string;
  PORT: number;
  FRONTEND_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  GEMINI_API_KEY: string;
  ADMIN_USERNAME: string;
  ADMIN_PASSWORD: string;
};
