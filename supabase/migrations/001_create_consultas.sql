CREATE TABLE IF NOT EXISTS consultas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_nome text NOT NULL,
    data_consulta date NOT NULL,
    status text,
    created_at timestamp with time zone DEFAULT now()
);  
