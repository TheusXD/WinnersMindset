-- Migration to support personalized, athlete-specific trainings

-- 1. Add atleta_id foreign key column to treinos
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS atleta_id UUID REFERENCES atletas(id) ON DELETE CASCADE;


