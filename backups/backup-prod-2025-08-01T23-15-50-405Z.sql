--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8 (Debian 16.8-1.pgdg120+1)
-- Dumped by pg_dump version 16.9 (Homebrew)

-- Started on 2025-08-01 20:15:50 -03

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE ONLY public.user_profiles DROP CONSTRAINT user_profiles_user_id_fkey;
ALTER TABLE ONLY public.prontuarios DROP CONSTRAINT prontuarios_paciente_id_fkey;
ALTER TABLE ONLY public.procedimentos_config DROP CONSTRAINT procedimentos_config_criado_por_fkey;
ALTER TABLE ONLY public.procedimentos_adicionais DROP CONSTRAINT procedimentos_adicionais_procedimento_id_fkey;
ALTER TABLE ONLY public.procedimentos_adicionais DROP CONSTRAINT procedimentos_adicionais_criado_por_fkey;
ALTER TABLE ONLY public.procedimentos_acessorios DROP CONSTRAINT procedimentos_acessorios_procedimento_id_fkey;
ALTER TABLE ONLY public.procedimentos_acessorios DROP CONSTRAINT procedimentos_acessorios_criado_por_fkey;
ALTER TABLE ONLY public.pagamentos DROP CONSTRAINT pagamentos_orcamento_id_fkey;
ALTER TABLE ONLY public.pagamentos DROP CONSTRAINT pagamentos_criado_por_fkey;
ALTER TABLE ONLY public.pacientes DROP CONSTRAINT pacientes_cadastrado_por_fkey;
ALTER TABLE ONLY public.orcamentos DROP CONSTRAINT orcamentos_paciente_id_fkey;
ALTER TABLE ONLY public.orcamentos DROP CONSTRAINT orcamentos_criado_por_fkey;
ALTER TABLE ONLY public.orcamentos DROP CONSTRAINT orcamentos_atualizado_por_fkey;
ALTER TABLE ONLY public.notificacoes DROP CONSTRAINT notificacoes_paciente_id_fkey;
ALTER TABLE ONLY public.notificacoes DROP CONSTRAINT notificacoes_funcionario_id_fkey;
ALTER TABLE ONLY public.logs_exclusao_lgpd DROP CONSTRAINT logs_exclusao_lgpd_executado_por_fkey;
ALTER TABLE ONLY public.jornada_paciente DROP CONSTRAINT jornada_paciente_paciente_id_fkey;
ALTER TABLE ONLY public.jornada_paciente DROP CONSTRAINT jornada_paciente_criado_por_fkey;
ALTER TABLE ONLY public.fichas_atendimento DROP CONSTRAINT fichas_atendimento_prontuario_id_fkey;
ALTER TABLE ONLY public.fichas_atendimento DROP CONSTRAINT fichas_atendimento_paciente_id_fkey;
ALTER TABLE ONLY public.fichas_atendimento DROP CONSTRAINT fichas_atendimento_criado_por_fkey;
ALTER TABLE ONLY public.fichas_atendimento DROP CONSTRAINT fichas_atendimento_atualizado_por_fkey;
ALTER TABLE ONLY public.fichas_atendimento DROP CONSTRAINT fichas_atendimento_agendamento_id_fkey;
ALTER TABLE ONLY public.contas_receber DROP CONSTRAINT contas_receber_paciente_id_fkey;
ALTER TABLE ONLY public.contas_receber DROP CONSTRAINT contas_receber_orcamento_id_fkey;
ALTER TABLE ONLY public.contas_receber DROP CONSTRAINT contas_receber_criado_por_fkey;
ALTER TABLE ONLY public.contas_pagar DROP CONSTRAINT contas_pagar_orcamento_relacionado_fkey;
ALTER TABLE ONLY public.contas_pagar DROP CONSTRAINT contas_pagar_funcionario_id_fkey;
ALTER TABLE ONLY public.contas_pagar DROP CONSTRAINT contas_pagar_criado_por_fkey;
ALTER TABLE ONLY public.consultas DROP CONSTRAINT consultas_paciente_id_fkey;
ALTER TABLE ONLY public.consentimentos_lgpd DROP CONSTRAINT consentimentos_lgpd_usuario_id_fkey;
DROP INDEX public.idx_rate_janela;
DROP INDEX public.idx_rate_identificador;
DROP INDEX public.idx_prontuarios_paciente;
DROP INDEX public.idx_prontuarios_numero;
DROP INDEX public.idx_procedimentos_tipo;
DROP INDEX public.idx_procedimentos_ativo;
DROP INDEX public.idx_procedimentos_area;
DROP INDEX public.idx_pagamentos_transaction;
DROP INDEX public.idx_pagamentos_status;
DROP INDEX public.idx_pagamentos_orcamento;
DROP INDEX public.idx_pagamentos_data;
DROP INDEX public.idx_orcamentos_validade;
DROP INDEX public.idx_orcamentos_status;
DROP INDEX public.idx_orcamentos_protocolo;
DROP INDEX public.idx_orcamentos_paciente;
DROP INDEX public.idx_orcamentos_data;
DROP INDEX public.idx_logs_ip;
DROP INDEX public.idx_logs_exclusao_usuario;
DROP INDEX public.idx_logs_exclusao_status;
DROP INDEX public.idx_logs_exclusao_data;
DROP INDEX public.idx_logs_evento;
DROP INDEX public.idx_logs_email;
DROP INDEX public.idx_logs_data;
DROP INDEX public.idx_logs_acesso_usuario;
DROP INDEX public.idx_logs_acesso_email;
DROP INDEX public.idx_logs_acesso_data;
DROP INDEX public.idx_logs_acesso_acao;
DROP INDEX public.idx_leads_status;
DROP INDEX public.idx_leads_protocolo;
DROP INDEX public.idx_leads_origem;
DROP INDEX public.idx_leads_data_captura;
DROP INDEX public.idx_historico_email;
DROP INDEX public.idx_historico_data;
DROP INDEX public.idx_fichas_prontuario;
DROP INDEX public.idx_fichas_paciente;
DROP INDEX public.idx_fichas_data;
DROP INDEX public.idx_fichas_agendamento;
DROP INDEX public.idx_contas_receber_vencimento;
DROP INDEX public.idx_contas_receber_status;
DROP INDEX public.idx_contas_receber_paciente;
DROP INDEX public.idx_contas_pagar_vencimento;
DROP INDEX public.idx_contas_pagar_tipo;
DROP INDEX public.idx_contas_pagar_status;
DROP INDEX public.idx_contas_pagar_funcionario;
DROP INDEX public.idx_consentimentos_usuario;
DROP INDEX public.idx_consentimentos_tipo;
DROP INDEX public.idx_consentimentos_ativo;
DROP INDEX public.idx_codigos_token;
DROP INDEX public.idx_codigos_expiracao;
DROP INDEX public.idx_codigos_email;
DROP INDEX public.idx_calendario_bloqueios_data;
DROP INDEX public.idx_agendamentos_status;
DROP INDEX public.idx_agendamentos_protocolo;
DROP INDEX public.idx_agendamentos_paciente;
DROP INDEX public.idx_agendamentos_origem;
DROP INDEX public.idx_agendamentos_data;
ALTER TABLE ONLY public.usuarios DROP CONSTRAINT usuarios_pkey;
ALTER TABLE ONLY public.usuarios DROP CONSTRAINT usuarios_email_key;
ALTER TABLE ONLY public.user_profiles DROP CONSTRAINT user_profiles_pkey;
ALTER TABLE ONLY public.system_config DROP CONSTRAINT system_config_pkey;
ALTER TABLE ONLY public.system_config DROP CONSTRAINT system_config_config_key_key;
ALTER TABLE ONLY public.rate_limit_recuperacao DROP CONSTRAINT rate_limit_recuperacao_pkey;
ALTER TABLE ONLY public.rate_limit_recuperacao DROP CONSTRAINT rate_limit_recuperacao_identificador_tipo_limite_key;
ALTER TABLE ONLY public.prontuarios DROP CONSTRAINT prontuarios_pkey;
ALTER TABLE ONLY public.prontuarios DROP CONSTRAINT prontuarios_numero_prontuario_key;
ALTER TABLE ONLY public.procedimentos_config DROP CONSTRAINT procedimentos_config_pkey;
ALTER TABLE ONLY public.procedimentos_config DROP CONSTRAINT procedimentos_config_nome_key;
ALTER TABLE ONLY public.procedimentos_adicionais DROP CONSTRAINT procedimentos_adicionais_pkey;
ALTER TABLE ONLY public.procedimentos_acessorios DROP CONSTRAINT procedimentos_acessorios_pkey;
ALTER TABLE ONLY public.pre_cadastros DROP CONSTRAINT pre_cadastros_pkey;
ALTER TABLE ONLY public.pre_cadastros DROP CONSTRAINT pre_cadastros_email_key;
ALTER TABLE ONLY public.pagamentos DROP CONSTRAINT pagamentos_pkey;
ALTER TABLE ONLY public.pacientes DROP CONSTRAINT pacientes_pkey;
ALTER TABLE ONLY public.pacientes DROP CONSTRAINT pacientes_email_key;
ALTER TABLE ONLY public.pacientes DROP CONSTRAINT pacientes_cpf_key;
ALTER TABLE ONLY public.orcamentos DROP CONSTRAINT orcamentos_protocolo_key;
ALTER TABLE ONLY public.orcamentos DROP CONSTRAINT orcamentos_pkey;
ALTER TABLE ONLY public.notificacoes DROP CONSTRAINT notificacoes_pkey;
ALTER TABLE ONLY public.logs_sistema DROP CONSTRAINT logs_sistema_pkey;
ALTER TABLE ONLY public.logs_recuperacao_senha DROP CONSTRAINT logs_recuperacao_senha_pkey;
ALTER TABLE ONLY public.logs_exclusao_lgpd DROP CONSTRAINT logs_exclusao_lgpd_pkey;
ALTER TABLE ONLY public.logs_acesso DROP CONSTRAINT logs_acesso_pkey;
ALTER TABLE ONLY public.leads DROP CONSTRAINT leads_protocolo_key;
ALTER TABLE ONLY public.leads DROP CONSTRAINT leads_pkey;
ALTER TABLE ONLY public.jornada_paciente DROP CONSTRAINT jornada_paciente_pkey;
ALTER TABLE ONLY public.historico_alteracao_senha DROP CONSTRAINT historico_alteracao_senha_pkey;
ALTER TABLE ONLY public.funcionarios DROP CONSTRAINT funcionarios_pkey;
ALTER TABLE ONLY public.funcionarios DROP CONSTRAINT funcionarios_email_key;
ALTER TABLE ONLY public.fichas_atendimento DROP CONSTRAINT fichas_atendimento_pkey;
ALTER TABLE ONLY public.contas_receber DROP CONSTRAINT contas_receber_pkey;
ALTER TABLE ONLY public.contas_pagar DROP CONSTRAINT contas_pagar_pkey;
ALTER TABLE ONLY public.consultas DROP CONSTRAINT consultas_pkey;
ALTER TABLE ONLY public.consentimentos_lgpd DROP CONSTRAINT consentimentos_lgpd_pkey;
ALTER TABLE ONLY public.codigos_recuperacao_ativos DROP CONSTRAINT codigos_recuperacao_ativos_token_key;
ALTER TABLE ONLY public.codigos_recuperacao_ativos DROP CONSTRAINT codigos_recuperacao_ativos_pkey;
ALTER TABLE ONLY public.codigos_recuperacao_ativos DROP CONSTRAINT codigos_recuperacao_ativos_email_key;
ALTER TABLE ONLY public.codigos_ativacao DROP CONSTRAINT codigos_ativacao_pkey;
ALTER TABLE ONLY public.calendario_config DROP CONSTRAINT calendario_config_pkey;
ALTER TABLE ONLY public.calendario_bloqueios DROP CONSTRAINT calendario_bloqueios_pkey;
ALTER TABLE ONLY public.agendamentos DROP CONSTRAINT agendamentos_protocolo_key;
ALTER TABLE ONLY public.agendamentos DROP CONSTRAINT agendamentos_pkey;
ALTER TABLE public.usuarios ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.user_profiles ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.system_config ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.rate_limit_recuperacao ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.prontuarios ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.procedimentos_config ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.procedimentos_adicionais ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.procedimentos_acessorios ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.pre_cadastros ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.pagamentos ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.pacientes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.orcamentos ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.notificacoes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.logs_sistema ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.logs_recuperacao_senha ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.logs_exclusao_lgpd ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.logs_acesso ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.leads ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.jornada_paciente ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.historico_alteracao_senha ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.funcionarios ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.fichas_atendimento ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.contas_receber ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.contas_pagar ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.consultas ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.consentimentos_lgpd ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.codigos_recuperacao_ativos ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.codigos_ativacao ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.calendario_config ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.calendario_bloqueios ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.agendamentos ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE public.usuarios_id_seq;
DROP TABLE public.usuarios;
DROP SEQUENCE public.user_profiles_id_seq;
DROP TABLE public.user_profiles;
DROP SEQUENCE public.system_config_id_seq;
DROP TABLE public.system_config;
DROP SEQUENCE public.rate_limit_recuperacao_id_seq;
DROP TABLE public.rate_limit_recuperacao;
DROP SEQUENCE public.prontuarios_id_seq;
DROP TABLE public.prontuarios;
DROP SEQUENCE public.procedimentos_config_id_seq;
DROP TABLE public.procedimentos_config;
DROP SEQUENCE public.procedimentos_adicionais_id_seq;
DROP TABLE public.procedimentos_adicionais;
DROP SEQUENCE public.procedimentos_acessorios_id_seq;
DROP TABLE public.procedimentos_acessorios;
DROP SEQUENCE public.pre_cadastros_id_seq;
DROP TABLE public.pre_cadastros;
DROP SEQUENCE public.pagamentos_id_seq;
DROP TABLE public.pagamentos;
DROP SEQUENCE public.pacientes_id_seq;
DROP TABLE public.pacientes;
DROP SEQUENCE public.orcamentos_id_seq;
DROP TABLE public.orcamentos;
DROP SEQUENCE public.notificacoes_id_seq;
DROP TABLE public.notificacoes;
DROP SEQUENCE public.logs_sistema_id_seq;
DROP TABLE public.logs_sistema;
DROP SEQUENCE public.logs_recuperacao_senha_id_seq;
DROP TABLE public.logs_recuperacao_senha;
DROP SEQUENCE public.logs_exclusao_lgpd_id_seq;
DROP TABLE public.logs_exclusao_lgpd;
DROP SEQUENCE public.logs_acesso_id_seq;
DROP TABLE public.logs_acesso;
DROP SEQUENCE public.leads_id_seq;
DROP TABLE public.leads;
DROP SEQUENCE public.jornada_paciente_id_seq;
DROP TABLE public.jornada_paciente;
DROP SEQUENCE public.historico_alteracao_senha_id_seq;
DROP TABLE public.historico_alteracao_senha;
DROP SEQUENCE public.funcionarios_id_seq;
DROP TABLE public.funcionarios;
DROP SEQUENCE public.fichas_atendimento_id_seq;
DROP TABLE public.fichas_atendimento;
DROP SEQUENCE public.contas_receber_id_seq;
DROP TABLE public.contas_receber;
DROP SEQUENCE public.contas_pagar_id_seq;
DROP TABLE public.contas_pagar;
DROP SEQUENCE public.consultas_id_seq;
DROP TABLE public.consultas;
DROP SEQUENCE public.consentimentos_lgpd_id_seq;
DROP TABLE public.consentimentos_lgpd;
DROP SEQUENCE public.codigos_recuperacao_ativos_id_seq;
DROP TABLE public.codigos_recuperacao_ativos;
DROP SEQUENCE public.codigos_ativacao_id_seq;
DROP TABLE public.codigos_ativacao;
DROP SEQUENCE public.calendario_config_id_seq;
DROP TABLE public.calendario_config;
DROP SEQUENCE public.calendario_bloqueios_id_seq;
DROP TABLE public.calendario_bloqueios;
DROP SEQUENCE public.agendamentos_id_seq;
DROP TABLE public.agendamentos;
DROP FUNCTION public.limpeza_codigos_expirados();
--
-- TOC entry 277 (class 1255 OID 17138)
-- Name: limpeza_codigos_expirados(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.limpeza_codigos_expirados() RETURNS integer
    LANGUAGE plpgsql
    AS $$
            DECLARE
                removidos INTEGER;
            BEGIN
                DELETE FROM codigos_recuperacao_ativos 
                WHERE expiracao < CURRENT_TIMESTAMP;
                
                GET DIAGNOSTICS removidos = ROW_COUNT;
                
                -- Log da limpeza
                INSERT INTO logs_recuperacao_senha (email, email_mascarado, evento, metadados)
                VALUES ('system', 'system', 'limpeza_automatica', 
                       jsonb_build_object('codigos_removidos', removidos));
                
                RETURN removidos;
            END;
            $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 240 (class 1259 OID 16593)
-- Name: agendamentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agendamentos (
    id integer NOT NULL,
    protocolo character varying(50) NOT NULL,
    paciente_id integer,
    paciente_nome character varying(255) NOT NULL,
    paciente_email character varying(255),
    paciente_telefone character varying(20),
    data_agendamento date NOT NULL,
    hora_agendamento time without time zone NOT NULL,
    tipo_consulta character varying(50) DEFAULT 'consulta'::character varying,
    status character varying(30) DEFAULT 'agendado'::character varying,
    origem character varying(30) DEFAULT 'secretaria'::character varying,
    observacoes text,
    valor_consulta numeric(10,2),
    valor_pago numeric(10,2) DEFAULT 0,
    forma_pagamento character varying(50),
    confirmado boolean DEFAULT false,
    lembrete_enviado boolean DEFAULT false,
    prontuario_criado boolean DEFAULT false,
    prontuario_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(100),
    updated_by character varying(100)
);


--
-- TOC entry 239 (class 1259 OID 16592)
-- Name: agendamentos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agendamentos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3898 (class 0 OID 0)
-- Dependencies: 239
-- Name: agendamentos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agendamentos_id_seq OWNED BY public.agendamentos.id;


--
-- TOC entry 244 (class 1259 OID 16632)
-- Name: calendario_bloqueios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calendario_bloqueios (
    id integer NOT NULL,
    data_inicio timestamp without time zone NOT NULL,
    data_fim timestamp without time zone NOT NULL,
    motivo character varying(255) NOT NULL,
    descricao text,
    tipo character varying(20) DEFAULT 'bloqueio'::character varying,
    recorrente boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(100)
);


--
-- TOC entry 243 (class 1259 OID 16631)
-- Name: calendario_bloqueios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.calendario_bloqueios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3899 (class 0 OID 0)
-- Dependencies: 243
-- Name: calendario_bloqueios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.calendario_bloqueios_id_seq OWNED BY public.calendario_bloqueios.id;


--
-- TOC entry 242 (class 1259 OID 16618)
-- Name: calendario_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.calendario_config (
    id integer NOT NULL,
    dia_semana integer NOT NULL,
    hora_inicio time without time zone NOT NULL,
    hora_fim time without time zone NOT NULL,
    intervalo_consulta integer DEFAULT 30,
    ativo boolean DEFAULT true,
    observacoes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT calendario_config_dia_semana_check CHECK (((dia_semana >= 0) AND (dia_semana <= 6)))
);


--
-- TOC entry 241 (class 1259 OID 16617)
-- Name: calendario_config_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.calendario_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3900 (class 0 OID 0)
-- Dependencies: 241
-- Name: calendario_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.calendario_config_id_seq OWNED BY public.calendario_config.id;


--
-- TOC entry 222 (class 1259 OID 16436)
-- Name: codigos_ativacao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.codigos_ativacao (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    codigo character varying(6) NOT NULL,
    token character varying(255),
    tentativas integer DEFAULT 0,
    validado boolean DEFAULT false,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 221 (class 1259 OID 16435)
-- Name: codigos_ativacao_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.codigos_ativacao_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3901 (class 0 OID 0)
-- Dependencies: 221
-- Name: codigos_ativacao_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.codigos_ativacao_id_seq OWNED BY public.codigos_ativacao.id;


--
-- TOC entry 272 (class 1259 OID 17153)
-- Name: codigos_recuperacao_ativos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.codigos_recuperacao_ativos (
    id bigint NOT NULL,
    email character varying(255) NOT NULL,
    codigo_hash character varying(64) NOT NULL,
    token character varying(64) NOT NULL,
    expiracao timestamp with time zone NOT NULL,
    tentativas integer DEFAULT 0,
    ip_solicitacao inet,
    user_agent_solicitacao text,
    data_criacao timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    data_ultima_tentativa timestamp with time zone,
    codigo character varying(10) DEFAULT ''::character varying NOT NULL,
    CONSTRAINT valid_expiracao CHECK ((expiracao > data_criacao)),
    CONSTRAINT valid_tentativas CHECK (((tentativas >= 0) AND (tentativas <= 3)))
);


--
-- TOC entry 271 (class 1259 OID 17152)
-- Name: codigos_recuperacao_ativos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.codigos_recuperacao_ativos_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3902 (class 0 OID 0)
-- Dependencies: 271
-- Name: codigos_recuperacao_ativos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.codigos_recuperacao_ativos_id_seq OWNED BY public.codigos_recuperacao_ativos.id;


--
-- TOC entry 252 (class 1259 OID 16815)
-- Name: consentimentos_lgpd; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consentimentos_lgpd (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    tipo_consentimento character varying(100) NOT NULL,
    finalidade text NOT NULL,
    data_consentimento timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    data_revogacao timestamp without time zone,
    ip_origem inet,
    ativo boolean DEFAULT true,
    versao_termos character varying(20) DEFAULT '1.0'::character varying,
    detalhes_consentimento jsonb
);


--
-- TOC entry 251 (class 1259 OID 16814)
-- Name: consentimentos_lgpd_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.consentimentos_lgpd_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3903 (class 0 OID 0)
-- Dependencies: 251
-- Name: consentimentos_lgpd_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.consentimentos_lgpd_id_seq OWNED BY public.consentimentos_lgpd.id;


--
-- TOC entry 218 (class 1259 OID 16404)
-- Name: consultas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.consultas (
    id integer NOT NULL,
    paciente_id integer,
    data_consulta timestamp without time zone NOT NULL,
    tipo_consulta character varying(100),
    observacoes text,
    status character varying(50) DEFAULT 'agendada'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    convenio character varying(100),
    telefone_contato character varying(20),
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 217 (class 1259 OID 16403)
-- Name: consultas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.consultas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3904 (class 0 OID 0)
-- Dependencies: 217
-- Name: consultas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.consultas_id_seq OWNED BY public.consultas.id;


--
-- TOC entry 266 (class 1259 OID 17015)
-- Name: contas_pagar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contas_pagar (
    id integer NOT NULL,
    funcionario_id integer,
    tipo character varying(50) NOT NULL,
    descricao character varying(255) NOT NULL,
    valor numeric(10,2) NOT NULL,
    data_vencimento date NOT NULL,
    data_pagamento timestamp without time zone,
    forma_pagamento character varying(50),
    status character varying(30) DEFAULT 'pendente'::character varying,
    orcamento_relacionado integer,
    observacoes text,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    criado_por integer
);


--
-- TOC entry 265 (class 1259 OID 17014)
-- Name: contas_pagar_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contas_pagar_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3905 (class 0 OID 0)
-- Dependencies: 265
-- Name: contas_pagar_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contas_pagar_id_seq OWNED BY public.contas_pagar.id;


--
-- TOC entry 264 (class 1259 OID 16985)
-- Name: contas_receber; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contas_receber (
    id integer NOT NULL,
    paciente_id integer NOT NULL,
    orcamento_id integer,
    procedimento character varying(255),
    valor_total numeric(10,2) NOT NULL,
    valor_pago numeric(10,2) DEFAULT 0,
    valor_pendente numeric(10,2) NOT NULL,
    data_vencimento date,
    data_pagamento timestamp without time zone,
    forma_pagamento character varying(50),
    status character varying(30) DEFAULT 'pendente'::character varying,
    observacoes text,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    criado_por integer
);


--
-- TOC entry 263 (class 1259 OID 16984)
-- Name: contas_receber_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contas_receber_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3906 (class 0 OID 0)
-- Dependencies: 263
-- Name: contas_receber_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contas_receber_id_seq OWNED BY public.contas_receber.id;


--
-- TOC entry 250 (class 1259 OID 16773)
-- Name: fichas_atendimento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fichas_atendimento (
    id integer NOT NULL,
    paciente_id integer NOT NULL,
    prontuario_id integer NOT NULL,
    agendamento_id integer,
    peso numeric(5,2),
    altura numeric(3,2),
    imc numeric(4,2),
    pressao_arterial character varying(20),
    procedimento_desejado text,
    motivo_principal text,
    historico_medico text,
    medicamentos_uso text,
    alergias text,
    observacoes_clinicas text,
    exame_fisico text,
    plano_tratamento text,
    orientacoes text,
    retorno_recomendado date,
    status character varying(20) DEFAULT 'em_andamento'::character varying,
    finalizada boolean DEFAULT false,
    data_finalizacao timestamp without time zone,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    criado_por integer NOT NULL,
    atualizado_por integer
);


--
-- TOC entry 249 (class 1259 OID 16772)
-- Name: fichas_atendimento_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fichas_atendimento_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3907 (class 0 OID 0)
-- Dependencies: 249
-- Name: fichas_atendimento_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fichas_atendimento_id_seq OWNED BY public.fichas_atendimento.id;


--
-- TOC entry 226 (class 1259 OID 16467)
-- Name: funcionarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.funcionarios (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    senha character varying(255) NOT NULL,
    telefone character varying(20),
    cpf character varying(14),
    tipo character varying(50) DEFAULT 'staff'::character varying NOT NULL,
    ativo boolean DEFAULT true,
    data_cadastro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    cadastrado_por character varying(50) DEFAULT 'system'::character varying
);


--
-- TOC entry 225 (class 1259 OID 16466)
-- Name: funcionarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.funcionarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3908 (class 0 OID 0)
-- Dependencies: 225
-- Name: funcionarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.funcionarios_id_seq OWNED BY public.funcionarios.id;


--
-- TOC entry 276 (class 1259 OID 17184)
-- Name: historico_alteracao_senha; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historico_alteracao_senha (
    id bigint NOT NULL,
    email character varying(255) NOT NULL,
    metodo_alteracao character varying(50) NOT NULL,
    ip_address inet,
    user_agent text,
    token_recuperacao character varying(64),
    observacoes text,
    data_alteracao timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_metodo CHECK (((metodo_alteracao)::text = ANY ((ARRAY['primeiro_acesso'::character varying, 'alteracao_manual'::character varying, 'recuperacao_codigo'::character varying, 'admin_reset'::character varying, 'expiracao_forcada'::character varying])::text[])))
);


--
-- TOC entry 275 (class 1259 OID 17183)
-- Name: historico_alteracao_senha_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.historico_alteracao_senha_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3909 (class 0 OID 0)
-- Dependencies: 275
-- Name: historico_alteracao_senha_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.historico_alteracao_senha_id_seq OWNED BY public.historico_alteracao_senha.id;


--
-- TOC entry 234 (class 1259 OID 16525)
-- Name: jornada_paciente; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jornada_paciente (
    id integer NOT NULL,
    paciente_id integer NOT NULL,
    tipo_evento character varying(50) NOT NULL,
    data_prevista date NOT NULL,
    data_realizada date,
    status character varying(30) DEFAULT 'pendente'::character varying,
    observacoes text,
    notificacao_enviada boolean DEFAULT false,
    data_notificacao timestamp without time zone,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    criado_por integer
);


--
-- TOC entry 233 (class 1259 OID 16524)
-- Name: jornada_paciente_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.jornada_paciente_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3910 (class 0 OID 0)
-- Dependencies: 233
-- Name: jornada_paciente_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.jornada_paciente_id_seq OWNED BY public.jornada_paciente.id;


--
-- TOC entry 238 (class 1259 OID 16571)
-- Name: leads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leads (
    id integer NOT NULL,
    protocolo character varying(50) NOT NULL,
    nome character varying(255) NOT NULL,
    telefone character varying(20),
    email character varying(255),
    idade integer,
    procedimento character varying(255) NOT NULL,
    observacoes text,
    origem character varying(100) DEFAULT 'landing-publica'::character varying,
    status character varying(20) DEFAULT 'novo'::character varying,
    data_captura timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    data_criacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    convertido_em_paciente boolean DEFAULT false,
    paciente_id integer,
    data_conversao timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 237 (class 1259 OID 16570)
-- Name: leads_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.leads_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3911 (class 0 OID 0)
-- Dependencies: 237
-- Name: leads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.leads_id_seq OWNED BY public.leads.id;


--
-- TOC entry 246 (class 1259 OID 16645)
-- Name: logs_acesso; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.logs_acesso (
    id integer NOT NULL,
    usuario_id integer,
    email character varying(255),
    ip_origem inet,
    user_agent text,
    acao character varying(100) NOT NULL,
    recurso_acessado character varying(255),
    sucesso boolean DEFAULT true,
    detalhes jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    data_acesso timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 245 (class 1259 OID 16644)
-- Name: logs_acesso_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.logs_acesso_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3912 (class 0 OID 0)
-- Dependencies: 245
-- Name: logs_acesso_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.logs_acesso_id_seq OWNED BY public.logs_acesso.id;


--
-- TOC entry 254 (class 1259 OID 16835)
-- Name: logs_exclusao_lgpd; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.logs_exclusao_lgpd (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    email_original character varying(255),
    nome_original character varying(255),
    motivo text NOT NULL,
    data_exclusao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    executado_por integer,
    status character varying(20) DEFAULT 'INICIADO'::character varying,
    dados_backup jsonb,
    ip_solicitacao inet,
    observacoes text
);


--
-- TOC entry 253 (class 1259 OID 16834)
-- Name: logs_exclusao_lgpd_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.logs_exclusao_lgpd_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3913 (class 0 OID 0)
-- Dependencies: 253
-- Name: logs_exclusao_lgpd_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.logs_exclusao_lgpd_id_seq OWNED BY public.logs_exclusao_lgpd.id;


--
-- TOC entry 270 (class 1259 OID 17141)
-- Name: logs_recuperacao_senha; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.logs_recuperacao_senha (
    id bigint NOT NULL,
    email character varying(255) NOT NULL,
    email_mascarado character varying(255),
    evento character varying(50) NOT NULL,
    ip_address inet,
    user_agent text,
    codigo_mascarado character varying(10),
    tentativas_codigo integer DEFAULT 0,
    token_usado character varying(64),
    metadados jsonb,
    data_criacao timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    acao character varying(50),
    resultado character varying(20),
    detalhes text
);


--
-- TOC entry 269 (class 1259 OID 17140)
-- Name: logs_recuperacao_senha_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.logs_recuperacao_senha_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3914 (class 0 OID 0)
-- Dependencies: 269
-- Name: logs_recuperacao_senha_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.logs_recuperacao_senha_id_seq OWNED BY public.logs_recuperacao_senha.id;


--
-- TOC entry 230 (class 1259 OID 16495)
-- Name: logs_sistema; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.logs_sistema (
    id integer NOT NULL,
    tipo character varying(50) NOT NULL,
    descricao text NOT NULL,
    usuario_id integer,
    data_evento timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    detalhes jsonb
);


--
-- TOC entry 229 (class 1259 OID 16494)
-- Name: logs_sistema_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.logs_sistema_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3915 (class 0 OID 0)
-- Dependencies: 229
-- Name: logs_sistema_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.logs_sistema_id_seq OWNED BY public.logs_sistema.id;


--
-- TOC entry 236 (class 1259 OID 16547)
-- Name: notificacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notificacoes (
    id integer NOT NULL,
    paciente_id integer,
    funcionario_id integer,
    tipo character varying(50) NOT NULL,
    titulo character varying(255) NOT NULL,
    mensagem text NOT NULL,
    canais jsonb DEFAULT '["email"]'::jsonb,
    enviada boolean DEFAULT false,
    data_envio timestamp without time zone,
    erro_envio text,
    tentativas integer DEFAULT 0,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 235 (class 1259 OID 16546)
-- Name: notificacoes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notificacoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3916 (class 0 OID 0)
-- Dependencies: 235
-- Name: notificacoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notificacoes_id_seq OWNED BY public.notificacoes.id;


--
-- TOC entry 256 (class 1259 OID 16869)
-- Name: orcamentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orcamentos (
    id integer NOT NULL,
    protocolo character varying(50) NOT NULL,
    paciente_id integer NOT NULL,
    paciente_nome character varying(255) NOT NULL,
    paciente_email character varying(255),
    paciente_telefone character varying(20),
    procedimentos jsonb DEFAULT '[]'::jsonb,
    valor_total numeric(10,2) DEFAULT 0 NOT NULL,
    desconto_percentual numeric(5,2) DEFAULT 0,
    desconto_valor numeric(10,2) DEFAULT 0,
    valor_final numeric(10,2) DEFAULT 0 NOT NULL,
    status character varying(30) DEFAULT 'rascunho'::character varying,
    data_validade date,
    data_envio timestamp without time zone,
    data_resposta timestamp without time zone,
    observacoes text,
    observacoes_internas text,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    criado_por integer NOT NULL,
    atualizado_por integer
);


--
-- TOC entry 255 (class 1259 OID 16868)
-- Name: orcamentos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.orcamentos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3917 (class 0 OID 0)
-- Dependencies: 255
-- Name: orcamentos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.orcamentos_id_seq OWNED BY public.orcamentos.id;


--
-- TOC entry 232 (class 1259 OID 16505)
-- Name: pacientes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pacientes (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    email character varying(255),
    telefone character varying(20),
    cpf character varying(14),
    data_nascimento date,
    endereco text,
    convenio character varying(100),
    numero_convenio character varying(50),
    status character varying(50) DEFAULT 'ativo'::character varying,
    primeira_consulta date,
    ultima_consulta date,
    proximo_retorno date,
    observacoes text,
    data_cadastro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    cadastrado_por integer
);


--
-- TOC entry 231 (class 1259 OID 16504)
-- Name: pacientes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pacientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3918 (class 0 OID 0)
-- Dependencies: 231
-- Name: pacientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pacientes_id_seq OWNED BY public.pacientes.id;


--
-- TOC entry 268 (class 1259 OID 17045)
-- Name: pagamentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pagamentos (
    id integer NOT NULL,
    orcamento_id integer NOT NULL,
    valor numeric(10,2) NOT NULL,
    tipo_pagamento character varying(50) NOT NULL,
    status character varying(30) DEFAULT 'pendente'::character varying,
    gateway_transaction_id character varying(255),
    data_pagamento timestamp without time zone,
    data_vencimento date,
    parcela_numero integer DEFAULT 1,
    parcela_total integer DEFAULT 1,
    metodo_pagamento character varying(50),
    observacoes text,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    criado_por integer
);


--
-- TOC entry 267 (class 1259 OID 17044)
-- Name: pagamentos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pagamentos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3919 (class 0 OID 0)
-- Dependencies: 267
-- Name: pagamentos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pagamentos_id_seq OWNED BY public.pagamentos.id;


--
-- TOC entry 220 (class 1259 OID 16422)
-- Name: pre_cadastros; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pre_cadastros (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    telefone character varying(20) NOT NULL,
    status character varying(50) DEFAULT 'aguardando_aprovacao'::character varying,
    aprovado_por character varying(255),
    data_aprovacao timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 219 (class 1259 OID 16421)
-- Name: pre_cadastros_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pre_cadastros_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3920 (class 0 OID 0)
-- Dependencies: 219
-- Name: pre_cadastros_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pre_cadastros_id_seq OWNED BY public.pre_cadastros.id;


--
-- TOC entry 262 (class 1259 OID 16961)
-- Name: procedimentos_acessorios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.procedimentos_acessorios (
    id integer NOT NULL,
    procedimento_id integer NOT NULL,
    nome character varying(255) NOT NULL,
    sem_custo boolean DEFAULT true,
    valor numeric(10,2) DEFAULT 0,
    quantidade_incluida integer DEFAULT 1,
    ativo boolean DEFAULT true,
    observacoes text,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    criado_por integer
);


--
-- TOC entry 261 (class 1259 OID 16960)
-- Name: procedimentos_acessorios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.procedimentos_acessorios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3921 (class 0 OID 0)
-- Dependencies: 261
-- Name: procedimentos_acessorios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.procedimentos_acessorios_id_seq OWNED BY public.procedimentos_acessorios.id;


--
-- TOC entry 260 (class 1259 OID 16939)
-- Name: procedimentos_adicionais; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.procedimentos_adicionais (
    id integer NOT NULL,
    procedimento_id integer NOT NULL,
    nome character varying(255) NOT NULL,
    tipo character varying(50) NOT NULL,
    valor numeric(10,2) NOT NULL,
    obrigatorio boolean DEFAULT false,
    ativo boolean DEFAULT true,
    observacoes text,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    criado_por integer
);


--
-- TOC entry 259 (class 1259 OID 16938)
-- Name: procedimentos_adicionais_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.procedimentos_adicionais_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3922 (class 0 OID 0)
-- Dependencies: 259
-- Name: procedimentos_adicionais_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.procedimentos_adicionais_id_seq OWNED BY public.procedimentos_adicionais.id;


--
-- TOC entry 258 (class 1259 OID 16908)
-- Name: procedimentos_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.procedimentos_config (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    tipo character varying(50) NOT NULL,
    area_corpo character varying(100),
    descricao text,
    valor_equipe numeric(10,2) DEFAULT 0,
    valor_hospital numeric(10,2) DEFAULT 0,
    valor_anestesista numeric(10,2) DEFAULT 0,
    valor_instrumentador numeric(10,2) DEFAULT 0,
    valor_assistente numeric(10,2) DEFAULT 0,
    pos_operatorio_dias integer DEFAULT 0,
    pos_operatorio_valor_dia numeric(10,2) DEFAULT 0,
    pos_operatorio_pacote boolean DEFAULT false,
    pos_operatorio_valor_pacote numeric(10,2) DEFAULT 0,
    ativo boolean DEFAULT true,
    tempo_estimado_minutos integer,
    observacoes text,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    criado_por integer
);


--
-- TOC entry 257 (class 1259 OID 16907)
-- Name: procedimentos_config_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.procedimentos_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3923 (class 0 OID 0)
-- Dependencies: 257
-- Name: procedimentos_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.procedimentos_config_id_seq OWNED BY public.procedimentos_config.id;


--
-- TOC entry 248 (class 1259 OID 16751)
-- Name: prontuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.prontuarios (
    id integer NOT NULL,
    paciente_id integer NOT NULL,
    numero_prontuario character varying(20) NOT NULL,
    data_criacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ativo boolean DEFAULT true,
    observacoes text,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 247 (class 1259 OID 16750)
-- Name: prontuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.prontuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3924 (class 0 OID 0)
-- Dependencies: 247
-- Name: prontuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.prontuarios_id_seq OWNED BY public.prontuarios.id;


--
-- TOC entry 274 (class 1259 OID 17170)
-- Name: rate_limit_recuperacao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rate_limit_recuperacao (
    id bigint NOT NULL,
    identificador character varying(255) NOT NULL,
    tipo_limite character varying(10) NOT NULL,
    contador integer DEFAULT 1,
    janela_inicio timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    ultima_tentativa timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_contador CHECK ((contador > 0)),
    CONSTRAINT valid_tipo CHECK (((tipo_limite)::text = ANY ((ARRAY['ip'::character varying, 'email'::character varying])::text[])))
);


--
-- TOC entry 273 (class 1259 OID 17169)
-- Name: rate_limit_recuperacao_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rate_limit_recuperacao_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3925 (class 0 OID 0)
-- Dependencies: 273
-- Name: rate_limit_recuperacao_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rate_limit_recuperacao_id_seq OWNED BY public.rate_limit_recuperacao.id;


--
-- TOC entry 228 (class 1259 OID 16482)
-- Name: system_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_config (
    id integer NOT NULL,
    config_key character varying(100) NOT NULL,
    config_value text,
    is_locked boolean DEFAULT false,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 227 (class 1259 OID 16481)
-- Name: system_config_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.system_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3926 (class 0 OID 0)
-- Dependencies: 227
-- Name: system_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.system_config_id_seq OWNED BY public.system_config.id;


--
-- TOC entry 224 (class 1259 OID 16451)
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_profiles (
    id integer NOT NULL,
    user_id integer,
    tipo character varying(50) NOT NULL,
    perfil character varying(50),
    permissoes text[],
    observacoes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 223 (class 1259 OID 16450)
-- Name: user_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3927 (class 0 OID 0)
-- Dependencies: 223
-- Name: user_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_profiles_id_seq OWNED BY public.user_profiles.id;


--
-- TOC entry 216 (class 1259 OID 16390)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nome character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    senha character varying(255) NOT NULL,
    telefone character varying(20),
    cpf character varying(14),
    tipo character varying(50) DEFAULT 'paciente'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    autorizado boolean DEFAULT true,
    status character varying(20) DEFAULT 'ativo'::character varying,
    data_nascimento date,
    pais character varying(10) DEFAULT '+55'::character varying,
    perfil_completo boolean DEFAULT false,
    data_ativacao timestamp without time zone
);


--
-- TOC entry 215 (class 1259 OID 16389)
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3928 (class 0 OID 0)
-- Dependencies: 215
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- TOC entry 3407 (class 2604 OID 16596)
-- Name: agendamentos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agendamentos ALTER COLUMN id SET DEFAULT nextval('public.agendamentos_id_seq'::regclass);


--
-- TOC entry 3422 (class 2604 OID 16635)
-- Name: calendario_bloqueios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendario_bloqueios ALTER COLUMN id SET DEFAULT nextval('public.calendario_bloqueios_id_seq'::regclass);


--
-- TOC entry 3417 (class 2604 OID 16621)
-- Name: calendario_config id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendario_config ALTER COLUMN id SET DEFAULT nextval('public.calendario_config_id_seq'::regclass);


--
-- TOC entry 3370 (class 2604 OID 16439)
-- Name: codigos_ativacao id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codigos_ativacao ALTER COLUMN id SET DEFAULT nextval('public.codigos_ativacao_id_seq'::regclass);


--
-- TOC entry 3495 (class 2604 OID 17156)
-- Name: codigos_recuperacao_ativos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codigos_recuperacao_ativos ALTER COLUMN id SET DEFAULT nextval('public.codigos_recuperacao_ativos_id_seq'::regclass);


--
-- TOC entry 3440 (class 2604 OID 16818)
-- Name: consentimentos_lgpd id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consentimentos_lgpd ALTER COLUMN id SET DEFAULT nextval('public.consentimentos_lgpd_id_seq'::regclass);


--
-- TOC entry 3362 (class 2604 OID 16407)
-- Name: consultas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultas ALTER COLUMN id SET DEFAULT nextval('public.consultas_id_seq'::regclass);


--
-- TOC entry 3483 (class 2604 OID 17018)
-- Name: contas_pagar id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contas_pagar ALTER COLUMN id SET DEFAULT nextval('public.contas_pagar_id_seq'::regclass);


--
-- TOC entry 3479 (class 2604 OID 16988)
-- Name: contas_receber id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contas_receber ALTER COLUMN id SET DEFAULT nextval('public.contas_receber_id_seq'::regclass);


--
-- TOC entry 3435 (class 2604 OID 16776)
-- Name: fichas_atendimento id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fichas_atendimento ALTER COLUMN id SET DEFAULT nextval('public.fichas_atendimento_id_seq'::regclass);


--
-- TOC entry 3377 (class 2604 OID 16470)
-- Name: funcionarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funcionarios ALTER COLUMN id SET DEFAULT nextval('public.funcionarios_id_seq'::regclass);


--
-- TOC entry 3503 (class 2604 OID 17187)
-- Name: historico_alteracao_senha id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_alteracao_senha ALTER COLUMN id SET DEFAULT nextval('public.historico_alteracao_senha_id_seq'::regclass);


--
-- TOC entry 3390 (class 2604 OID 16528)
-- Name: jornada_paciente id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jornada_paciente ALTER COLUMN id SET DEFAULT nextval('public.jornada_paciente_id_seq'::regclass);


--
-- TOC entry 3399 (class 2604 OID 16574)
-- Name: leads id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads ALTER COLUMN id SET DEFAULT nextval('public.leads_id_seq'::regclass);


--
-- TOC entry 3426 (class 2604 OID 16648)
-- Name: logs_acesso id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logs_acesso ALTER COLUMN id SET DEFAULT nextval('public.logs_acesso_id_seq'::regclass);


--
-- TOC entry 3444 (class 2604 OID 16838)
-- Name: logs_exclusao_lgpd id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logs_exclusao_lgpd ALTER COLUMN id SET DEFAULT nextval('public.logs_exclusao_lgpd_id_seq'::regclass);


--
-- TOC entry 3492 (class 2604 OID 17144)
-- Name: logs_recuperacao_senha id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logs_recuperacao_senha ALTER COLUMN id SET DEFAULT nextval('public.logs_recuperacao_senha_id_seq'::regclass);


--
-- TOC entry 3385 (class 2604 OID 16498)
-- Name: logs_sistema id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logs_sistema ALTER COLUMN id SET DEFAULT nextval('public.logs_sistema_id_seq'::regclass);


--
-- TOC entry 3394 (class 2604 OID 16550)
-- Name: notificacoes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes ALTER COLUMN id SET DEFAULT nextval('public.notificacoes_id_seq'::regclass);


--
-- TOC entry 3447 (class 2604 OID 16872)
-- Name: orcamentos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orcamentos ALTER COLUMN id SET DEFAULT nextval('public.orcamentos_id_seq'::regclass);


--
-- TOC entry 3387 (class 2604 OID 16508)
-- Name: pacientes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pacientes ALTER COLUMN id SET DEFAULT nextval('public.pacientes_id_seq'::regclass);


--
-- TOC entry 3486 (class 2604 OID 17048)
-- Name: pagamentos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagamentos ALTER COLUMN id SET DEFAULT nextval('public.pagamentos_id_seq'::regclass);


--
-- TOC entry 3366 (class 2604 OID 16425)
-- Name: pre_cadastros id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pre_cadastros ALTER COLUMN id SET DEFAULT nextval('public.pre_cadastros_id_seq'::regclass);


--
-- TOC entry 3473 (class 2604 OID 16964)
-- Name: procedimentos_acessorios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedimentos_acessorios ALTER COLUMN id SET DEFAULT nextval('public.procedimentos_acessorios_id_seq'::regclass);


--
-- TOC entry 3469 (class 2604 OID 16942)
-- Name: procedimentos_adicionais id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedimentos_adicionais ALTER COLUMN id SET DEFAULT nextval('public.procedimentos_adicionais_id_seq'::regclass);


--
-- TOC entry 3456 (class 2604 OID 16911)
-- Name: procedimentos_config id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedimentos_config ALTER COLUMN id SET DEFAULT nextval('public.procedimentos_config_id_seq'::regclass);


--
-- TOC entry 3430 (class 2604 OID 16754)
-- Name: prontuarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prontuarios ALTER COLUMN id SET DEFAULT nextval('public.prontuarios_id_seq'::regclass);


--
-- TOC entry 3499 (class 2604 OID 17173)
-- Name: rate_limit_recuperacao id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_limit_recuperacao ALTER COLUMN id SET DEFAULT nextval('public.rate_limit_recuperacao_id_seq'::regclass);


--
-- TOC entry 3382 (class 2604 OID 16485)
-- Name: system_config id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_config ALTER COLUMN id SET DEFAULT nextval('public.system_config_id_seq'::regclass);


--
-- TOC entry 3374 (class 2604 OID 16454)
-- Name: user_profiles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles ALTER COLUMN id SET DEFAULT nextval('public.user_profiles_id_seq'::regclass);


--
-- TOC entry 3354 (class 2604 OID 16393)
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- TOC entry 3856 (class 0 OID 16593)
-- Dependencies: 240
-- Data for Name: agendamentos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.agendamentos (id, protocolo, paciente_id, paciente_nome, paciente_email, paciente_telefone, data_agendamento, hora_agendamento, tipo_consulta, status, origem, observacoes, valor_consulta, valor_pago, forma_pagamento, confirmado, lembrete_enviado, prontuario_criado, prontuario_id, created_at, updated_at, created_by, updated_by) FROM stdin;
\.


--
-- TOC entry 3860 (class 0 OID 16632)
-- Dependencies: 244
-- Data for Name: calendario_bloqueios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.calendario_bloqueios (id, data_inicio, data_fim, motivo, descricao, tipo, recorrente, created_at, created_by) FROM stdin;
\.


--
-- TOC entry 3858 (class 0 OID 16618)
-- Dependencies: 242
-- Data for Name: calendario_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.calendario_config (id, dia_semana, hora_inicio, hora_fim, intervalo_consulta, ativo, observacoes, created_at, updated_at) FROM stdin;
1	1	08:00:00	12:00:00	30	t	\N	2025-07-31 10:34:00.518181	2025-07-31 10:34:00.518181
2	1	14:00:00	18:00:00	30	t	\N	2025-07-31 10:34:00.518181	2025-07-31 10:34:00.518181
3	2	08:00:00	12:00:00	30	t	\N	2025-07-31 10:34:00.518181	2025-07-31 10:34:00.518181
4	2	14:00:00	18:00:00	30	t	\N	2025-07-31 10:34:00.518181	2025-07-31 10:34:00.518181
5	3	08:00:00	12:00:00	30	t	\N	2025-07-31 10:34:00.518181	2025-07-31 10:34:00.518181
6	3	14:00:00	18:00:00	30	t	\N	2025-07-31 10:34:00.518181	2025-07-31 10:34:00.518181
7	4	08:00:00	12:00:00	30	t	\N	2025-07-31 10:34:00.518181	2025-07-31 10:34:00.518181
8	4	14:00:00	18:00:00	30	t	\N	2025-07-31 10:34:00.518181	2025-07-31 10:34:00.518181
9	5	08:00:00	12:00:00	30	t	\N	2025-07-31 10:34:00.518181	2025-07-31 10:34:00.518181
10	5	14:00:00	18:00:00	30	t	\N	2025-07-31 10:34:00.518181	2025-07-31 10:34:00.518181
\.


--
-- TOC entry 3838 (class 0 OID 16436)
-- Dependencies: 222
-- Data for Name: codigos_ativacao; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.codigos_ativacao (id, email, codigo, token, tentativas, validado, expires_at, created_at) FROM stdin;
\.


--
-- TOC entry 3888 (class 0 OID 17153)
-- Dependencies: 272
-- Data for Name: codigos_recuperacao_ativos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.codigos_recuperacao_ativos (id, email, codigo_hash, token, expiracao, tentativas, ip_solicitacao, user_agent_solicitacao, data_criacao, data_ultima_tentativa, codigo) FROM stdin;
2	dr.marcio@teste.com	c0034605ea413370d5ad022b8d2f7fe33461bf6d7e5f4ac78f02c27b793673c9	819c77521c7e1ee7cf6f6e26a53d00b388fea2881848a122d5844cffab22d1c6	2025-08-01 22:53:15.304343+00	0	192.168.1.100	Mozilla/5.0 Medical Portal	2025-08-01 22:38:15.304343+00	\N	789123
5	dr.marcio@clinica.com	685f188e4f25af63603dc5b579b31090f459381a242bf7002c8a8e8ea322a4ef	70f37a9f6d2b2871cba079a7500a1019e1cc3abdf4433a4e21db85007457f3a6	2025-08-01 22:57:51.114981+00	0	127.0.0.1	Test Browser	2025-08-01 22:42:51.114981+00	\N	999888
\.


--
-- TOC entry 3868 (class 0 OID 16815)
-- Dependencies: 252
-- Data for Name: consentimentos_lgpd; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.consentimentos_lgpd (id, usuario_id, tipo_consentimento, finalidade, data_consentimento, data_revogacao, ip_origem, ativo, versao_termos, detalhes_consentimento) FROM stdin;
\.


--
-- TOC entry 3834 (class 0 OID 16404)
-- Dependencies: 218
-- Data for Name: consultas; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.consultas (id, paciente_id, data_consulta, tipo_consulta, observacoes, status, created_at, convenio, telefone_contato, updated_at) FROM stdin;
\.


--
-- TOC entry 3882 (class 0 OID 17015)
-- Dependencies: 266
-- Data for Name: contas_pagar; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contas_pagar (id, funcionario_id, tipo, descricao, valor, data_vencimento, data_pagamento, forma_pagamento, status, orcamento_relacionado, observacoes, criado_em, criado_por) FROM stdin;
\.


--
-- TOC entry 3880 (class 0 OID 16985)
-- Dependencies: 264
-- Data for Name: contas_receber; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contas_receber (id, paciente_id, orcamento_id, procedimento, valor_total, valor_pago, valor_pendente, data_vencimento, data_pagamento, forma_pagamento, status, observacoes, criado_em, criado_por) FROM stdin;
\.


--
-- TOC entry 3866 (class 0 OID 16773)
-- Dependencies: 250
-- Data for Name: fichas_atendimento; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.fichas_atendimento (id, paciente_id, prontuario_id, agendamento_id, peso, altura, imc, pressao_arterial, procedimento_desejado, motivo_principal, historico_medico, medicamentos_uso, alergias, observacoes_clinicas, exame_fisico, plano_tratamento, orientacoes, retorno_recomendado, status, finalizada, data_finalizacao, criado_em, atualizado_em, criado_por, atualizado_por) FROM stdin;
\.


--
-- TOC entry 3842 (class 0 OID 16467)
-- Dependencies: 226
-- Data for Name: funcionarios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.funcionarios (id, nome, email, senha, telefone, cpf, tipo, ativo, data_cadastro, cadastrado_por) FROM stdin;
\.


--
-- TOC entry 3892 (class 0 OID 17184)
-- Dependencies: 276
-- Data for Name: historico_alteracao_senha; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.historico_alteracao_senha (id, email, metodo_alteracao, ip_address, user_agent, token_recuperacao, observacoes, data_alteracao) FROM stdin;
\.


--
-- TOC entry 3850 (class 0 OID 16525)
-- Dependencies: 234
-- Data for Name: jornada_paciente; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.jornada_paciente (id, paciente_id, tipo_evento, data_prevista, data_realizada, status, observacoes, notificacao_enviada, data_notificacao, criado_em, criado_por) FROM stdin;
\.


--
-- TOC entry 3854 (class 0 OID 16571)
-- Dependencies: 238
-- Data for Name: leads; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.leads (id, protocolo, nome, telefone, email, idade, procedimento, observacoes, origem, status, data_captura, data_criacao, convertido_em_paciente, paciente_id, data_conversao, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3862 (class 0 OID 16645)
-- Dependencies: 246
-- Data for Name: logs_acesso; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.logs_acesso (id, usuario_id, email, ip_origem, user_agent, acao, recurso_acessado, sucesso, detalhes, created_at, data_acesso) FROM stdin;
1	\N	\N	::ffff:100.64.0.2	RailwayHealthCheck/1.0	GET /setup	/setup	t	{"query": {}, "headers": {"host": "healthcheck.railway.app", "referer": "http://fd12:881e:7ce1:0:a000:11:3123:839:3000/api/health", "connection": "close", "user-agent": "RailwayHealthCheck/1.0", "accept-encoding": "gzip"}, "timestamp": "2025-07-31T10:34:01.096Z"}	2025-07-31 10:34:01.147663	2025-07-31 10:34:01.147663
2	\N	\N	::ffff:100.64.0.3	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	GET /setup	/setup	t	{"query": {}, "headers": {"host": "portal-dr-marcio-production.up.railway.app", "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7", "priority": "u=0, i", "sec-ch-ua": "\\"Not)A;Brand\\";v=\\"8\\", \\"Chromium\\";v=\\"138\\", \\"Google Chrome\\";v=\\"138\\"", "x-real-ip": "189.100.71.223", "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "sec-fetch-dest": "document", "sec-fetch-mode": "navigate", "sec-fetch-site": "cross-site", "sec-fetch-user": "?1", "x-railway-edge": "railway/us-east4-eqdc4a", "accept-encoding": "gzip, deflate, br, zstd", "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7", "x-forwarded-for": "189.100.71.223", "x-request-start": "1753960017231", "sec-ch-ua-mobile": "?0", "x-forwarded-host": "portal-dr-marcio-production.up.railway.app", "x-forwarded-proto": "https", "sec-ch-ua-platform": "\\"macOS\\"", "x-railway-request-id": "mATzE2TvRlWD873VCx5-qw", "upgrade-insecure-requests": "1"}, "timestamp": "2025-07-31T11:06:57.236Z"}	2025-07-31 11:06:57.289056	2025-07-31 11:06:57.289056
3	\N	\N	::ffff:100.64.0.3	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	GET /favicon.ico	/favicon.ico	t	{"query": {}, "headers": {"host": "portal-dr-marcio-production.up.railway.app", "accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8", "referer": "https://portal-dr-marcio-production.up.railway.app/setup", "priority": "u=1, i", "sec-ch-ua": "\\"Not)A;Brand\\";v=\\"8\\", \\"Chromium\\";v=\\"138\\", \\"Google Chrome\\";v=\\"138\\"", "x-real-ip": "189.100.71.223", "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "sec-fetch-dest": "image", "sec-fetch-mode": "no-cors", "sec-fetch-site": "same-origin", "x-railway-edge": "railway/us-east4-eqdc4a", "accept-encoding": "gzip, deflate, br, zstd", "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7", "x-forwarded-for": "189.100.71.223", "x-request-start": "1753960017659", "sec-ch-ua-mobile": "?0", "x-forwarded-host": "portal-dr-marcio-production.up.railway.app", "x-forwarded-proto": "https", "sec-ch-ua-platform": "\\"macOS\\"", "x-railway-request-id": "rE3TfyITRdKuVfEHCx5-qw"}, "timestamp": "2025-07-31T11:06:57.668Z"}	2025-07-31 11:06:57.669485	2025-07-31 11:06:57.669485
4	\N	\N	::ffff:100.64.0.2	RailwayHealthCheck/1.0	GET /setup	/setup	t	{"query": {}, "headers": {"host": "healthcheck.railway.app", "referer": "http://fd12:881e:7ce1:0:a000:43:c1e3:c3a7:3000/health", "connection": "close", "user-agent": "RailwayHealthCheck/1.0", "accept-encoding": "gzip"}, "timestamp": "2025-07-31T11:14:07.238Z"}	2025-07-31 11:14:07.289057	2025-07-31 11:14:07.289057
5	\N	\N	::ffff:100.64.0.2	RailwayHealthCheck/1.0	GET /setup	/setup	t	{"query": {}, "headers": {"host": "healthcheck.railway.app", "referer": "http://fd12:881e:7ce1:0:a000:25:c69d:3d6a:3000/health", "connection": "close", "user-agent": "RailwayHealthCheck/1.0", "accept-encoding": "gzip"}, "timestamp": "2025-07-31T11:21:44.434Z"}	2025-07-31 11:21:44.483924	2025-07-31 11:21:44.483924
6	\N	\N	::ffff:100.64.0.3	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	GET /setup	/setup	t	{"query": {}, "headers": {"host": "portal-dr-marcio-production.up.railway.app", "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7", "priority": "u=0, i", "sec-ch-ua": "\\"Not)A;Brand\\";v=\\"8\\", \\"Chromium\\";v=\\"138\\", \\"Google Chrome\\";v=\\"138\\"", "x-real-ip": "189.100.71.223", "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "if-none-match": "W/\\"7f10-198600b15e0\\"", "sec-fetch-dest": "document", "sec-fetch-mode": "navigate", "sec-fetch-site": "cross-site", "sec-fetch-user": "?1", "x-railway-edge": "railway/us-east4-eqdc4a", "accept-encoding": "gzip, deflate, br, zstd", "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7", "x-forwarded-for": "189.100.71.223", "x-request-start": "1753961589185", "sec-ch-ua-mobile": "?0", "x-forwarded-host": "portal-dr-marcio-production.up.railway.app", "if-modified-since": "Thu, 31 Jul 2025 10:33:16 GMT", "x-forwarded-proto": "https", "sec-ch-ua-platform": "\\"macOS\\"", "x-railway-request-id": "d-_iNnkgTlWZT5P5g4a9AQ", "upgrade-insecure-requests": "1"}, "timestamp": "2025-07-31T11:33:09.187Z"}	2025-07-31 11:33:09.230403	2025-07-31 11:33:09.230403
7	\N	\N	::ffff:100.64.0.2	RailwayHealthCheck/1.0	GET /setup	/setup	t	{"query": {}, "headers": {"host": "healthcheck.railway.app", "referer": "http://fd12:881e:7ce1:0:a000:35:4c47:6c06:3000/health", "connection": "close", "user-agent": "RailwayHealthCheck/1.0", "accept-encoding": "gzip"}, "timestamp": "2025-07-31T11:47:37.466Z"}	2025-07-31 11:47:37.662237	2025-07-31 11:47:37.662237
8	\N	\N	::ffff:100.64.0.3	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	GET /setup	/setup	t	{"query": {}, "headers": {"host": "portal-dr-marcio-production.up.railway.app", "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7", "priority": "u=0, i", "sec-ch-ua": "\\"Not)A;Brand\\";v=\\"8\\", \\"Chromium\\";v=\\"138\\", \\"Google Chrome\\";v=\\"138\\"", "x-real-ip": "189.100.71.223", "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "sec-fetch-dest": "document", "sec-fetch-mode": "navigate", "sec-fetch-site": "none", "sec-fetch-user": "?1", "x-railway-edge": "railway/us-east4-eqdc4a", "accept-encoding": "gzip, deflate, br, zstd", "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7", "x-forwarded-for": "189.100.71.223", "x-request-start": "1753962554566", "sec-ch-ua-mobile": "?0", "x-forwarded-host": "portal-dr-marcio-production.up.railway.app", "x-forwarded-proto": "https", "sec-ch-ua-platform": "\\"macOS\\"", "x-railway-request-id": "rTaRSSIoTF6upRMeCx5-qw", "upgrade-insecure-requests": "1"}, "timestamp": "2025-07-31T11:49:14.568Z"}	2025-07-31 11:49:14.622424	2025-07-31 11:49:14.622424
9	\N	\N	::ffff:100.64.0.2	RailwayHealthCheck/1.0	GET /setup	/setup	t	{"query": {}, "headers": {"host": "healthcheck.railway.app", "referer": "http://fd12:881e:7ce1:0:a000:11:b94e:4a22:3000/health", "connection": "close", "user-agent": "RailwayHealthCheck/1.0", "accept-encoding": "gzip"}, "timestamp": "2025-07-31T12:01:19.051Z"}	2025-07-31 12:01:19.117147	2025-07-31 12:01:19.117147
10	\N	\N	::ffff:100.64.0.3	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	GET /setup	/setup	t	{"query": {}, "headers": {"host": "portal-dr-marcio-production.up.railway.app", "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7", "priority": "u=0, i", "sec-ch-ua": "\\"Not)A;Brand\\";v=\\"8\\", \\"Chromium\\";v=\\"138\\", \\"Google Chrome\\";v=\\"138\\"", "x-real-ip": "189.100.71.223", "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "if-none-match": "W/\\"7f10-19860367f28\\"", "sec-fetch-dest": "document", "sec-fetch-mode": "navigate", "sec-fetch-site": "cross-site", "sec-fetch-user": "?1", "x-railway-edge": "railway/us-east4-eqdc4a", "accept-encoding": "gzip, deflate, br, zstd", "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7", "x-forwarded-for": "189.100.71.223", "x-request-start": "1753963333937", "sec-ch-ua-mobile": "?0", "x-forwarded-host": "portal-dr-marcio-production.up.railway.app", "if-modified-since": "Thu, 31 Jul 2025 11:20:41 GMT", "x-forwarded-proto": "https", "sec-ch-ua-platform": "\\"macOS\\"", "x-railway-request-id": "uGptS1ucRRuGXIILCx5-qw", "upgrade-insecure-requests": "1"}, "timestamp": "2025-07-31T12:02:13.948Z"}	2025-07-31 12:02:14.009029	2025-07-31 12:02:14.009029
11	\N	\N	::ffff:100.64.0.4	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36	GET /setup	/setup	t	{"query": {}, "headers": {"host": "portal-dr-marcio-production.up.railway.app", "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7", "priority": "u=0, i", "sec-ch-ua": "\\"Not)A;Brand\\";v=\\"8\\", \\"Chromium\\";v=\\"138\\", \\"Google Chrome\\";v=\\"138\\"", "x-real-ip": "189.100.71.223", "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36", "if-none-match": "W/\\"7f10-198604e54b8\\"", "sec-fetch-dest": "document", "sec-fetch-mode": "navigate", "sec-fetch-site": "none", "sec-fetch-user": "?1", "x-railway-edge": "railway/us-east4-eqdc4a", "accept-encoding": "gzip, deflate, br, zstd", "accept-language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7", "x-forwarded-for": "189.100.71.223", "x-request-start": "1753963543990", "sec-ch-ua-mobile": "?0", "x-forwarded-host": "portal-dr-marcio-production.up.railway.app", "if-modified-since": "Thu, 31 Jul 2025 11:46:43 GMT", "x-forwarded-proto": "https", "sec-ch-ua-platform": "\\"macOS\\"", "x-railway-request-id": "w1l941-8QMChWdVYAax-fw", "upgrade-insecure-requests": "1"}, "timestamp": "2025-07-31T12:05:44.052Z"}	2025-07-31 12:05:44.125471	2025-07-31 12:05:44.125471
12	\N	\N	::ffff:100.64.0.2	RailwayHealthCheck/1.0	GET /health	/health	t	{"query": {}, "headers": {"host": "healthcheck.railway.app", "connection": "close", "user-agent": "RailwayHealthCheck/1.0", "accept-encoding": "gzip"}, "timestamp": "2025-08-01T06:19:38.044Z"}	2025-08-01 06:19:38.145353	2025-08-01 06:19:38.145353
13	\N	\N	::ffff:100.64.0.2	RailwayHealthCheck/1.0	GET /health	/health	t	{"query": {}, "headers": {"host": "healthcheck.railway.app", "connection": "close", "user-agent": "RailwayHealthCheck/1.0", "accept-encoding": "gzip"}, "timestamp": "2025-08-01T06:28:14.293Z"}	2025-08-01 06:28:14.397524	2025-08-01 06:28:14.397524
14	\N	\N	::ffff:100.64.0.2	RailwayHealthCheck/1.0	GET /health	/health	t	{"query": {}, "headers": {"host": "healthcheck.railway.app", "connection": "close", "user-agent": "RailwayHealthCheck/1.0", "accept-encoding": "gzip"}, "timestamp": "2025-08-01T07:59:55.814Z"}	2025-08-01 07:59:55.922484	2025-08-01 07:59:55.922484
15	\N	\N	::ffff:100.64.0.2	RailwayHealthCheck/1.0	GET /health	/health	t	{"query": {}, "headers": {"host": "healthcheck.railway.app", "connection": "close", "user-agent": "RailwayHealthCheck/1.0", "accept-encoding": "gzip"}, "timestamp": "2025-08-01T08:11:43.906Z"}	2025-08-01 08:11:44.01031	2025-08-01 08:11:44.01031
16	\N	\N	::ffff:100.64.0.2	RailwayHealthCheck/1.0	GET /health	/health	t	{"query": {}, "headers": {"host": "healthcheck.railway.app", "connection": "close", "user-agent": "RailwayHealthCheck/1.0", "accept-encoding": "gzip"}, "timestamp": "2025-08-01T08:19:24.653Z"}	2025-08-01 08:19:24.696696	2025-08-01 08:19:24.696696
17	\N	\N	::ffff:100.64.0.2	RailwayHealthCheck/1.0	GET /health	/health	t	{"query": {}, "headers": {"host": "healthcheck.railway.app", "connection": "close", "user-agent": "RailwayHealthCheck/1.0", "accept-encoding": "gzip"}, "timestamp": "2025-08-01T09:04:21.067Z"}	2025-08-01 09:04:21.126826	2025-08-01 09:04:21.126826
18	\N	\N	::ffff:100.64.0.2	RailwayHealthCheck/1.0	GET /health	/health	t	{"query": {}, "headers": {"host": "healthcheck.railway.app", "connection": "close", "user-agent": "RailwayHealthCheck/1.0", "accept-encoding": "gzip"}, "timestamp": "2025-08-01T09:13:50.153Z"}	2025-08-01 09:13:50.205049	2025-08-01 09:13:50.205049
19	\N	\N	::ffff:100.64.0.2	RailwayHealthCheck/1.0	GET /health	/health	t	{"query": {}, "headers": {"host": "healthcheck.railway.app", "connection": "close", "user-agent": "RailwayHealthCheck/1.0", "accept-encoding": "gzip"}, "timestamp": "2025-08-01T09:28:50.760Z"}	2025-08-01 09:28:50.861226	2025-08-01 09:28:50.861226
20	\N	\N	::ffff:100.64.0.2	RailwayHealthCheck/1.0	GET /health	/health	t	{"query": {}, "headers": {"host": "healthcheck.railway.app", "connection": "close", "user-agent": "RailwayHealthCheck/1.0", "accept-encoding": "gzip"}, "timestamp": "2025-08-01T09:34:05.279Z"}	2025-08-01 09:34:05.38011	2025-08-01 09:34:05.38011
21	\N	\N	::ffff:100.64.0.2	RailwayHealthCheck/1.0	GET /health	/health	t	{"query": {}, "headers": {"host": "healthcheck.railway.app", "connection": "close", "user-agent": "RailwayHealthCheck/1.0", "accept-encoding": "gzip"}, "timestamp": "2025-08-01T09:54:56.260Z"}	2025-08-01 09:54:56.300585	2025-08-01 09:54:56.300585
22	\N	\N	::ffff:100.64.0.2	RailwayHealthCheck/1.0	GET /health	/health	t	{"query": {}, "headers": {"host": "healthcheck.railway.app", "connection": "close", "user-agent": "RailwayHealthCheck/1.0", "accept-encoding": "gzip"}, "timestamp": "2025-08-01T10:07:48.198Z"}	2025-08-01 10:07:48.305579	2025-08-01 10:07:48.305579
\.


--
-- TOC entry 3870 (class 0 OID 16835)
-- Dependencies: 254
-- Data for Name: logs_exclusao_lgpd; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.logs_exclusao_lgpd (id, usuario_id, email_original, nome_original, motivo, data_exclusao, executado_por, status, dados_backup, ip_solicitacao, observacoes) FROM stdin;
\.


--
-- TOC entry 3886 (class 0 OID 17141)
-- Dependencies: 270
-- Data for Name: logs_recuperacao_senha; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.logs_recuperacao_senha (id, email, email_mascarado, evento, ip_address, user_agent, codigo_mascarado, tentativas_codigo, token_usado, metadados, data_criacao, acao, resultado, detalhes) FROM stdin;
5	dr.marcio@clinica.com	\N	teste_sucesso	127.0.0.1	\N	\N	0	\N	\N	2025-08-01 22:42:52.033983+00	\N	sucesso	Sistema funcionando perfeitamente
\.


--
-- TOC entry 3846 (class 0 OID 16495)
-- Dependencies: 230
-- Data for Name: logs_sistema; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.logs_sistema (id, tipo, descricao, usuario_id, data_evento, detalhes) FROM stdin;
\.


--
-- TOC entry 3852 (class 0 OID 16547)
-- Dependencies: 236
-- Data for Name: notificacoes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notificacoes (id, paciente_id, funcionario_id, tipo, titulo, mensagem, canais, enviada, data_envio, erro_envio, tentativas, criado_em) FROM stdin;
\.


--
-- TOC entry 3872 (class 0 OID 16869)
-- Dependencies: 256
-- Data for Name: orcamentos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.orcamentos (id, protocolo, paciente_id, paciente_nome, paciente_email, paciente_telefone, procedimentos, valor_total, desconto_percentual, desconto_valor, valor_final, status, data_validade, data_envio, data_resposta, observacoes, observacoes_internas, criado_em, atualizado_em, criado_por, atualizado_por) FROM stdin;
\.


--
-- TOC entry 3848 (class 0 OID 16505)
-- Dependencies: 232
-- Data for Name: pacientes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pacientes (id, nome, email, telefone, cpf, data_nascimento, endereco, convenio, numero_convenio, status, primeira_consulta, ultima_consulta, proximo_retorno, observacoes, data_cadastro, cadastrado_por) FROM stdin;
\.


--
-- TOC entry 3884 (class 0 OID 17045)
-- Dependencies: 268
-- Data for Name: pagamentos; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pagamentos (id, orcamento_id, valor, tipo_pagamento, status, gateway_transaction_id, data_pagamento, data_vencimento, parcela_numero, parcela_total, metodo_pagamento, observacoes, criado_em, atualizado_em, criado_por) FROM stdin;
\.


--
-- TOC entry 3836 (class 0 OID 16422)
-- Dependencies: 220
-- Data for Name: pre_cadastros; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pre_cadastros (id, nome, email, telefone, status, aprovado_por, data_aprovacao, created_at, updated_at) FROM stdin;
1	Joao Gente	joao@email.com	11999999999	aguardando_aprovacao	\N	\N	2025-07-30 03:24:34.431274	2025-07-30 03:24:34.431274
\.


--
-- TOC entry 3878 (class 0 OID 16961)
-- Dependencies: 262
-- Data for Name: procedimentos_acessorios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.procedimentos_acessorios (id, procedimento_id, nome, sem_custo, valor, quantidade_incluida, ativo, observacoes, criado_em, criado_por) FROM stdin;
\.


--
-- TOC entry 3876 (class 0 OID 16939)
-- Dependencies: 260
-- Data for Name: procedimentos_adicionais; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.procedimentos_adicionais (id, procedimento_id, nome, tipo, valor, obrigatorio, ativo, observacoes, criado_em, criado_por) FROM stdin;
\.


--
-- TOC entry 3874 (class 0 OID 16908)
-- Dependencies: 258
-- Data for Name: procedimentos_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.procedimentos_config (id, nome, tipo, area_corpo, descricao, valor_equipe, valor_hospital, valor_anestesista, valor_instrumentador, valor_assistente, pos_operatorio_dias, pos_operatorio_valor_dia, pos_operatorio_pacote, pos_operatorio_valor_pacote, ativo, tempo_estimado_minutos, observacoes, criado_em, atualizado_em, criado_por) FROM stdin;
\.


--
-- TOC entry 3864 (class 0 OID 16751)
-- Dependencies: 248
-- Data for Name: prontuarios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.prontuarios (id, paciente_id, numero_prontuario, data_criacao, ativo, observacoes, criado_em, atualizado_em) FROM stdin;
\.


--
-- TOC entry 3890 (class 0 OID 17170)
-- Dependencies: 274
-- Data for Name: rate_limit_recuperacao; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rate_limit_recuperacao (id, identificador, tipo_limite, contador, janela_inicio, ultima_tentativa) FROM stdin;
\.


--
-- TOC entry 3844 (class 0 OID 16482)
-- Dependencies: 228
-- Data for Name: system_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_config (id, config_key, config_value, is_locked, created_by, created_at) FROM stdin;
\.


--
-- TOC entry 3840 (class 0 OID 16451)
-- Dependencies: 224
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_profiles (id, user_id, tipo, perfil, permissoes, observacoes, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 3832 (class 0 OID 16390)
-- Dependencies: 216
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.usuarios (id, nome, email, senha, telefone, cpf, tipo, created_at, updated_at, autorizado, status, data_nascimento, pais, perfil_completo, data_ativacao) FROM stdin;
1	Dr. Marcio Scartozzoni	admin@mscartozzoni.com.br	$2b$10$ywQqvn3eLeOrOIKqqu0yneLKLCKdstMXY5x761hAm41tbc0fOm4dC	\N	\N	admin	2025-07-29 18:20:28.137644	2025-07-29 20:37:14.239375	t	ativo	\N	+55	f	\N
3	Marcio Scartozzoni	clinica@mscartozzoni.com.br	$2b$10$pwPV60J0bGZA6hiWMslJY.1ALTx95ch8JlUQlOi1FmHu/kiITo7Q.	\N	\N	paciente	2025-07-29 20:54:42.185538	2025-07-29 20:54:42.185538	t	ativo	\N	+55	f	\N
4	Marcio Samara	marcioscartozzoni@gmail.com	$2b$10$zEB3hMQZl9ZKmE1wvZdxYevIXl.wUe7lsKYqAyMjoT.mo.pYInC3a	\N	\N	paciente	2025-07-29 20:55:57.171983	2025-07-29 20:55:57.171983	t	ativo	\N	+55	f	\N
2	Marcio Scartozzoni	admin@clinica.com	$2b$10$yNaRMKQSQcQdjXv6gpY8.ubEEw4Lz1Ddcqa2bRu.roLrz2iooJsLu	\N	\N	admin	2025-07-29 20:38:33.387344	2025-07-29 20:38:33.387344	t	ativo	\N	+55	f	\N
5	Dennis Cristian de Oliveira Júnior 	oliveiradennis365@gmail.com	$2b$10$R9dQZ1987IBnjXzhlJvd7OHQ3ligNGHrn49RMjOPJtMU4X2NOzc/2	11913437403	\N	funcionario	2025-07-29 21:24:13.739811	2025-07-29 23:29:02.607101	t	pending	\N	+55	f	\N
7	Marcio Scartozzoni	admin@drmarcio.com	$2b$10$khYJwFeN0.due59M.zkFfe414KGUSVzp31wEvZlK/NKq3D79Nil8u	\N	\N	funcionario	2025-07-30 02:18:51.911749	2025-07-30 02:21:14.318205	t	pending	\N	+55	f	\N
6	Marcio Scartozzoni	marcio.scartozzoni@icloud.com	$2b$10$RjgRfoJhxn/P/yCdtix/MeSW/vYzxoCw6pJvacj8JWYcviVaRzWZe	\N	\N	paciente	2025-07-30 02:17:30.670701	2025-07-30 02:22:27.449436	f	pending	\N	+55	f	\N
8	Marcio Scartozzoni	administracao@mscartozzoni.com.br	$2b$10$.yEDC2YNKpDbllUJt2CdVOIWiMB8TMx8mN7Oc.dr.UiOAf.ScHT..	11932357636	30263645843	paciente	2025-07-30 19:19:02.851911	2025-07-30 19:19:02.851911	f	pending	\N	+55	f	\N
\.


--
-- TOC entry 3929 (class 0 OID 0)
-- Dependencies: 239
-- Name: agendamentos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.agendamentos_id_seq', 1, false);


--
-- TOC entry 3930 (class 0 OID 0)
-- Dependencies: 243
-- Name: calendario_bloqueios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.calendario_bloqueios_id_seq', 1, false);


--
-- TOC entry 3931 (class 0 OID 0)
-- Dependencies: 241
-- Name: calendario_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.calendario_config_id_seq', 10, true);


--
-- TOC entry 3932 (class 0 OID 0)
-- Dependencies: 221
-- Name: codigos_ativacao_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.codigos_ativacao_id_seq', 1, false);


--
-- TOC entry 3933 (class 0 OID 0)
-- Dependencies: 271
-- Name: codigos_recuperacao_ativos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.codigos_recuperacao_ativos_id_seq', 6, true);


--
-- TOC entry 3934 (class 0 OID 0)
-- Dependencies: 251
-- Name: consentimentos_lgpd_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.consentimentos_lgpd_id_seq', 1, false);


--
-- TOC entry 3935 (class 0 OID 0)
-- Dependencies: 217
-- Name: consultas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.consultas_id_seq', 1, false);


--
-- TOC entry 3936 (class 0 OID 0)
-- Dependencies: 265
-- Name: contas_pagar_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.contas_pagar_id_seq', 1, false);


--
-- TOC entry 3937 (class 0 OID 0)
-- Dependencies: 263
-- Name: contas_receber_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.contas_receber_id_seq', 1, false);


--
-- TOC entry 3938 (class 0 OID 0)
-- Dependencies: 249
-- Name: fichas_atendimento_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.fichas_atendimento_id_seq', 1, false);


--
-- TOC entry 3939 (class 0 OID 0)
-- Dependencies: 225
-- Name: funcionarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.funcionarios_id_seq', 1, false);


--
-- TOC entry 3940 (class 0 OID 0)
-- Dependencies: 275
-- Name: historico_alteracao_senha_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.historico_alteracao_senha_id_seq', 1, false);


--
-- TOC entry 3941 (class 0 OID 0)
-- Dependencies: 233
-- Name: jornada_paciente_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.jornada_paciente_id_seq', 1, false);


--
-- TOC entry 3942 (class 0 OID 0)
-- Dependencies: 237
-- Name: leads_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.leads_id_seq', 1, false);


--
-- TOC entry 3943 (class 0 OID 0)
-- Dependencies: 245
-- Name: logs_acesso_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.logs_acesso_id_seq', 22, true);


--
-- TOC entry 3944 (class 0 OID 0)
-- Dependencies: 253
-- Name: logs_exclusao_lgpd_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.logs_exclusao_lgpd_id_seq', 1, false);


--
-- TOC entry 3945 (class 0 OID 0)
-- Dependencies: 269
-- Name: logs_recuperacao_senha_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.logs_recuperacao_senha_id_seq', 5, true);


--
-- TOC entry 3946 (class 0 OID 0)
-- Dependencies: 229
-- Name: logs_sistema_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.logs_sistema_id_seq', 1, false);


--
-- TOC entry 3947 (class 0 OID 0)
-- Dependencies: 235
-- Name: notificacoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notificacoes_id_seq', 1, false);


--
-- TOC entry 3948 (class 0 OID 0)
-- Dependencies: 255
-- Name: orcamentos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.orcamentos_id_seq', 1, false);


--
-- TOC entry 3949 (class 0 OID 0)
-- Dependencies: 231
-- Name: pacientes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pacientes_id_seq', 1, false);


--
-- TOC entry 3950 (class 0 OID 0)
-- Dependencies: 267
-- Name: pagamentos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pagamentos_id_seq', 1, false);


--
-- TOC entry 3951 (class 0 OID 0)
-- Dependencies: 219
-- Name: pre_cadastros_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.pre_cadastros_id_seq', 1, true);


--
-- TOC entry 3952 (class 0 OID 0)
-- Dependencies: 261
-- Name: procedimentos_acessorios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.procedimentos_acessorios_id_seq', 1, false);


--
-- TOC entry 3953 (class 0 OID 0)
-- Dependencies: 259
-- Name: procedimentos_adicionais_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.procedimentos_adicionais_id_seq', 1, false);


--
-- TOC entry 3954 (class 0 OID 0)
-- Dependencies: 257
-- Name: procedimentos_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.procedimentos_config_id_seq', 1, false);


--
-- TOC entry 3955 (class 0 OID 0)
-- Dependencies: 247
-- Name: prontuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.prontuarios_id_seq', 1, false);


--
-- TOC entry 3956 (class 0 OID 0)
-- Dependencies: 273
-- Name: rate_limit_recuperacao_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.rate_limit_recuperacao_id_seq', 1, false);


--
-- TOC entry 3957 (class 0 OID 0)
-- Dependencies: 227
-- Name: system_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.system_config_id_seq', 1, false);


--
-- TOC entry 3958 (class 0 OID 0)
-- Dependencies: 223
-- Name: user_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_profiles_id_seq', 1, false);


--
-- TOC entry 3959 (class 0 OID 0)
-- Dependencies: 215
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 8, true);


--
-- TOC entry 3554 (class 2606 OID 16609)
-- Name: agendamentos agendamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agendamentos
    ADD CONSTRAINT agendamentos_pkey PRIMARY KEY (id);


--
-- TOC entry 3556 (class 2606 OID 16611)
-- Name: agendamentos agendamentos_protocolo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agendamentos
    ADD CONSTRAINT agendamentos_protocolo_key UNIQUE (protocolo);


--
-- TOC entry 3565 (class 2606 OID 16642)
-- Name: calendario_bloqueios calendario_bloqueios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendario_bloqueios
    ADD CONSTRAINT calendario_bloqueios_pkey PRIMARY KEY (id);


--
-- TOC entry 3563 (class 2606 OID 16630)
-- Name: calendario_config calendario_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.calendario_config
    ADD CONSTRAINT calendario_config_pkey PRIMARY KEY (id);


--
-- TOC entry 3522 (class 2606 OID 16446)
-- Name: codigos_ativacao codigos_ativacao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codigos_ativacao
    ADD CONSTRAINT codigos_ativacao_pkey PRIMARY KEY (id);


--
-- TOC entry 3639 (class 2606 OID 17166)
-- Name: codigos_recuperacao_ativos codigos_recuperacao_ativos_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codigos_recuperacao_ativos
    ADD CONSTRAINT codigos_recuperacao_ativos_email_key UNIQUE (email);


--
-- TOC entry 3641 (class 2606 OID 17164)
-- Name: codigos_recuperacao_ativos codigos_recuperacao_ativos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codigos_recuperacao_ativos
    ADD CONSTRAINT codigos_recuperacao_ativos_pkey PRIMARY KEY (id);


--
-- TOC entry 3643 (class 2606 OID 17168)
-- Name: codigos_recuperacao_ativos codigos_recuperacao_ativos_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.codigos_recuperacao_ativos
    ADD CONSTRAINT codigos_recuperacao_ativos_token_key UNIQUE (token);


--
-- TOC entry 3586 (class 2606 OID 16825)
-- Name: consentimentos_lgpd consentimentos_lgpd_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consentimentos_lgpd
    ADD CONSTRAINT consentimentos_lgpd_pkey PRIMARY KEY (id);


--
-- TOC entry 3516 (class 2606 OID 16413)
-- Name: consultas consultas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultas
    ADD CONSTRAINT consultas_pkey PRIMARY KEY (id);


--
-- TOC entry 3621 (class 2606 OID 17024)
-- Name: contas_pagar contas_pagar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contas_pagar
    ADD CONSTRAINT contas_pagar_pkey PRIMARY KEY (id);


--
-- TOC entry 3616 (class 2606 OID 16995)
-- Name: contas_receber contas_receber_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contas_receber
    ADD CONSTRAINT contas_receber_pkey PRIMARY KEY (id);


--
-- TOC entry 3580 (class 2606 OID 16784)
-- Name: fichas_atendimento fichas_atendimento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fichas_atendimento
    ADD CONSTRAINT fichas_atendimento_pkey PRIMARY KEY (id);


--
-- TOC entry 3526 (class 2606 OID 16480)
-- Name: funcionarios funcionarios_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT funcionarios_email_key UNIQUE (email);


--
-- TOC entry 3528 (class 2606 OID 16478)
-- Name: funcionarios funcionarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.funcionarios
    ADD CONSTRAINT funcionarios_pkey PRIMARY KEY (id);


--
-- TOC entry 3654 (class 2606 OID 17193)
-- Name: historico_alteracao_senha historico_alteracao_senha_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historico_alteracao_senha
    ADD CONSTRAINT historico_alteracao_senha_pkey PRIMARY KEY (id);


--
-- TOC entry 3542 (class 2606 OID 16535)
-- Name: jornada_paciente jornada_paciente_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jornada_paciente
    ADD CONSTRAINT jornada_paciente_pkey PRIMARY KEY (id);


--
-- TOC entry 3550 (class 2606 OID 16585)
-- Name: leads leads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_pkey PRIMARY KEY (id);


--
-- TOC entry 3552 (class 2606 OID 16587)
-- Name: leads leads_protocolo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leads
    ADD CONSTRAINT leads_protocolo_key UNIQUE (protocolo);


--
-- TOC entry 3572 (class 2606 OID 16655)
-- Name: logs_acesso logs_acesso_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logs_acesso
    ADD CONSTRAINT logs_acesso_pkey PRIMARY KEY (id);


--
-- TOC entry 3594 (class 2606 OID 16844)
-- Name: logs_exclusao_lgpd logs_exclusao_lgpd_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logs_exclusao_lgpd
    ADD CONSTRAINT logs_exclusao_lgpd_pkey PRIMARY KEY (id);


--
-- TOC entry 3637 (class 2606 OID 17151)
-- Name: logs_recuperacao_senha logs_recuperacao_senha_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logs_recuperacao_senha
    ADD CONSTRAINT logs_recuperacao_senha_pkey PRIMARY KEY (id);


--
-- TOC entry 3534 (class 2606 OID 16503)
-- Name: logs_sistema logs_sistema_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logs_sistema
    ADD CONSTRAINT logs_sistema_pkey PRIMARY KEY (id);


--
-- TOC entry 3544 (class 2606 OID 16558)
-- Name: notificacoes notificacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes
    ADD CONSTRAINT notificacoes_pkey PRIMARY KEY (id);


--
-- TOC entry 3601 (class 2606 OID 16884)
-- Name: orcamentos orcamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_pkey PRIMARY KEY (id);


--
-- TOC entry 3603 (class 2606 OID 16886)
-- Name: orcamentos orcamentos_protocolo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_protocolo_key UNIQUE (protocolo);


--
-- TOC entry 3536 (class 2606 OID 16518)
-- Name: pacientes pacientes_cpf_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pacientes
    ADD CONSTRAINT pacientes_cpf_key UNIQUE (cpf);


--
-- TOC entry 3538 (class 2606 OID 16516)
-- Name: pacientes pacientes_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pacientes
    ADD CONSTRAINT pacientes_email_key UNIQUE (email);


--
-- TOC entry 3540 (class 2606 OID 16514)
-- Name: pacientes pacientes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pacientes
    ADD CONSTRAINT pacientes_pkey PRIMARY KEY (id);


--
-- TOC entry 3631 (class 2606 OID 17057)
-- Name: pagamentos pagamentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT pagamentos_pkey PRIMARY KEY (id);


--
-- TOC entry 3518 (class 2606 OID 16434)
-- Name: pre_cadastros pre_cadastros_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pre_cadastros
    ADD CONSTRAINT pre_cadastros_email_key UNIQUE (email);


--
-- TOC entry 3520 (class 2606 OID 16432)
-- Name: pre_cadastros pre_cadastros_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pre_cadastros
    ADD CONSTRAINT pre_cadastros_pkey PRIMARY KEY (id);


--
-- TOC entry 3614 (class 2606 OID 16973)
-- Name: procedimentos_acessorios procedimentos_acessorios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedimentos_acessorios
    ADD CONSTRAINT procedimentos_acessorios_pkey PRIMARY KEY (id);


--
-- TOC entry 3612 (class 2606 OID 16949)
-- Name: procedimentos_adicionais procedimentos_adicionais_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedimentos_adicionais
    ADD CONSTRAINT procedimentos_adicionais_pkey PRIMARY KEY (id);


--
-- TOC entry 3608 (class 2606 OID 16929)
-- Name: procedimentos_config procedimentos_config_nome_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedimentos_config
    ADD CONSTRAINT procedimentos_config_nome_key UNIQUE (nome);


--
-- TOC entry 3610 (class 2606 OID 16927)
-- Name: procedimentos_config procedimentos_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedimentos_config
    ADD CONSTRAINT procedimentos_config_pkey PRIMARY KEY (id);


--
-- TOC entry 3576 (class 2606 OID 16764)
-- Name: prontuarios prontuarios_numero_prontuario_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prontuarios
    ADD CONSTRAINT prontuarios_numero_prontuario_key UNIQUE (numero_prontuario);


--
-- TOC entry 3578 (class 2606 OID 16762)
-- Name: prontuarios prontuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prontuarios
    ADD CONSTRAINT prontuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 3650 (class 2606 OID 17182)
-- Name: rate_limit_recuperacao rate_limit_recuperacao_identificador_tipo_limite_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_limit_recuperacao
    ADD CONSTRAINT rate_limit_recuperacao_identificador_tipo_limite_key UNIQUE (identificador, tipo_limite);


--
-- TOC entry 3652 (class 2606 OID 17180)
-- Name: rate_limit_recuperacao rate_limit_recuperacao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_limit_recuperacao
    ADD CONSTRAINT rate_limit_recuperacao_pkey PRIMARY KEY (id);


--
-- TOC entry 3530 (class 2606 OID 16493)
-- Name: system_config system_config_config_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_config
    ADD CONSTRAINT system_config_config_key_key UNIQUE (config_key);


--
-- TOC entry 3532 (class 2606 OID 16491)
-- Name: system_config system_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_config
    ADD CONSTRAINT system_config_pkey PRIMARY KEY (id);


--
-- TOC entry 3524 (class 2606 OID 16460)
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- TOC entry 3512 (class 2606 OID 16402)
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- TOC entry 3514 (class 2606 OID 16400)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 3557 (class 1259 OID 16612)
-- Name: idx_agendamentos_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agendamentos_data ON public.agendamentos USING btree (data_agendamento);


--
-- TOC entry 3558 (class 1259 OID 16615)
-- Name: idx_agendamentos_origem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agendamentos_origem ON public.agendamentos USING btree (origem);


--
-- TOC entry 3559 (class 1259 OID 16614)
-- Name: idx_agendamentos_paciente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agendamentos_paciente ON public.agendamentos USING btree (paciente_id);


--
-- TOC entry 3560 (class 1259 OID 16616)
-- Name: idx_agendamentos_protocolo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agendamentos_protocolo ON public.agendamentos USING btree (protocolo);


--
-- TOC entry 3561 (class 1259 OID 16613)
-- Name: idx_agendamentos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agendamentos_status ON public.agendamentos USING btree (status);


--
-- TOC entry 3566 (class 1259 OID 16643)
-- Name: idx_calendario_bloqueios_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_calendario_bloqueios_data ON public.calendario_bloqueios USING btree (data_inicio, data_fim);


--
-- TOC entry 3644 (class 1259 OID 17198)
-- Name: idx_codigos_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_codigos_email ON public.codigos_recuperacao_ativos USING btree (email);


--
-- TOC entry 3645 (class 1259 OID 17200)
-- Name: idx_codigos_expiracao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_codigos_expiracao ON public.codigos_recuperacao_ativos USING btree (expiracao);


--
-- TOC entry 3646 (class 1259 OID 17199)
-- Name: idx_codigos_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_codigos_token ON public.codigos_recuperacao_ativos USING btree (token);


--
-- TOC entry 3587 (class 1259 OID 16833)
-- Name: idx_consentimentos_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_consentimentos_ativo ON public.consentimentos_lgpd USING btree (ativo);


--
-- TOC entry 3588 (class 1259 OID 16832)
-- Name: idx_consentimentos_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_consentimentos_tipo ON public.consentimentos_lgpd USING btree (tipo_consentimento);


--
-- TOC entry 3589 (class 1259 OID 16831)
-- Name: idx_consentimentos_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_consentimentos_usuario ON public.consentimentos_lgpd USING btree (usuario_id);


--
-- TOC entry 3622 (class 1259 OID 17042)
-- Name: idx_contas_pagar_funcionario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contas_pagar_funcionario ON public.contas_pagar USING btree (funcionario_id);


--
-- TOC entry 3623 (class 1259 OID 17040)
-- Name: idx_contas_pagar_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contas_pagar_status ON public.contas_pagar USING btree (status);


--
-- TOC entry 3624 (class 1259 OID 17043)
-- Name: idx_contas_pagar_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contas_pagar_tipo ON public.contas_pagar USING btree (tipo);


--
-- TOC entry 3625 (class 1259 OID 17041)
-- Name: idx_contas_pagar_vencimento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contas_pagar_vencimento ON public.contas_pagar USING btree (data_vencimento);


--
-- TOC entry 3617 (class 1259 OID 17013)
-- Name: idx_contas_receber_paciente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contas_receber_paciente ON public.contas_receber USING btree (paciente_id);


--
-- TOC entry 3618 (class 1259 OID 17011)
-- Name: idx_contas_receber_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contas_receber_status ON public.contas_receber USING btree (status);


--
-- TOC entry 3619 (class 1259 OID 17012)
-- Name: idx_contas_receber_vencimento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contas_receber_vencimento ON public.contas_receber USING btree (data_vencimento);


--
-- TOC entry 3581 (class 1259 OID 16812)
-- Name: idx_fichas_agendamento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fichas_agendamento ON public.fichas_atendimento USING btree (agendamento_id);


--
-- TOC entry 3582 (class 1259 OID 16813)
-- Name: idx_fichas_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fichas_data ON public.fichas_atendimento USING btree (criado_em);


--
-- TOC entry 3583 (class 1259 OID 16810)
-- Name: idx_fichas_paciente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fichas_paciente ON public.fichas_atendimento USING btree (paciente_id);


--
-- TOC entry 3584 (class 1259 OID 16811)
-- Name: idx_fichas_prontuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fichas_prontuario ON public.fichas_atendimento USING btree (prontuario_id);


--
-- TOC entry 3655 (class 1259 OID 17204)
-- Name: idx_historico_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_historico_data ON public.historico_alteracao_senha USING btree (data_alteracao);


--
-- TOC entry 3656 (class 1259 OID 17203)
-- Name: idx_historico_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_historico_email ON public.historico_alteracao_senha USING btree (email);


--
-- TOC entry 3545 (class 1259 OID 16591)
-- Name: idx_leads_data_captura; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_data_captura ON public.leads USING btree (data_captura);


--
-- TOC entry 3546 (class 1259 OID 16590)
-- Name: idx_leads_origem; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_origem ON public.leads USING btree (origem);


--
-- TOC entry 3547 (class 1259 OID 16588)
-- Name: idx_leads_protocolo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_protocolo ON public.leads USING btree (protocolo);


--
-- TOC entry 3548 (class 1259 OID 16589)
-- Name: idx_leads_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leads_status ON public.leads USING btree (status);


--
-- TOC entry 3567 (class 1259 OID 16658)
-- Name: idx_logs_acesso_acao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_acesso_acao ON public.logs_acesso USING btree (acao);


--
-- TOC entry 3568 (class 1259 OID 16659)
-- Name: idx_logs_acesso_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_acesso_data ON public.logs_acesso USING btree (data_acesso);


--
-- TOC entry 3569 (class 1259 OID 16657)
-- Name: idx_logs_acesso_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_acesso_email ON public.logs_acesso USING btree (email);


--
-- TOC entry 3570 (class 1259 OID 16656)
-- Name: idx_logs_acesso_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_acesso_usuario ON public.logs_acesso USING btree (usuario_id);


--
-- TOC entry 3632 (class 1259 OID 17196)
-- Name: idx_logs_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_data ON public.logs_recuperacao_senha USING btree (data_criacao);


--
-- TOC entry 3633 (class 1259 OID 17194)
-- Name: idx_logs_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_email ON public.logs_recuperacao_senha USING btree (email);


--
-- TOC entry 3634 (class 1259 OID 17195)
-- Name: idx_logs_evento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_evento ON public.logs_recuperacao_senha USING btree (evento);


--
-- TOC entry 3590 (class 1259 OID 16851)
-- Name: idx_logs_exclusao_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_exclusao_data ON public.logs_exclusao_lgpd USING btree (data_exclusao);


--
-- TOC entry 3591 (class 1259 OID 16852)
-- Name: idx_logs_exclusao_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_exclusao_status ON public.logs_exclusao_lgpd USING btree (status);


--
-- TOC entry 3592 (class 1259 OID 16850)
-- Name: idx_logs_exclusao_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_exclusao_usuario ON public.logs_exclusao_lgpd USING btree (usuario_id);


--
-- TOC entry 3635 (class 1259 OID 17197)
-- Name: idx_logs_ip; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_logs_ip ON public.logs_recuperacao_senha USING btree (ip_address);


--
-- TOC entry 3595 (class 1259 OID 16905)
-- Name: idx_orcamentos_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orcamentos_data ON public.orcamentos USING btree (criado_em);


--
-- TOC entry 3596 (class 1259 OID 16903)
-- Name: idx_orcamentos_paciente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orcamentos_paciente ON public.orcamentos USING btree (paciente_id);


--
-- TOC entry 3597 (class 1259 OID 16902)
-- Name: idx_orcamentos_protocolo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orcamentos_protocolo ON public.orcamentos USING btree (protocolo);


--
-- TOC entry 3598 (class 1259 OID 16904)
-- Name: idx_orcamentos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orcamentos_status ON public.orcamentos USING btree (status);


--
-- TOC entry 3599 (class 1259 OID 16906)
-- Name: idx_orcamentos_validade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orcamentos_validade ON public.orcamentos USING btree (data_validade);


--
-- TOC entry 3626 (class 1259 OID 17070)
-- Name: idx_pagamentos_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_data ON public.pagamentos USING btree (data_pagamento);


--
-- TOC entry 3627 (class 1259 OID 17068)
-- Name: idx_pagamentos_orcamento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_orcamento ON public.pagamentos USING btree (orcamento_id);


--
-- TOC entry 3628 (class 1259 OID 17069)
-- Name: idx_pagamentos_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_status ON public.pagamentos USING btree (status);


--
-- TOC entry 3629 (class 1259 OID 17071)
-- Name: idx_pagamentos_transaction; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pagamentos_transaction ON public.pagamentos USING btree (gateway_transaction_id);


--
-- TOC entry 3604 (class 1259 OID 16936)
-- Name: idx_procedimentos_area; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_procedimentos_area ON public.procedimentos_config USING btree (area_corpo);


--
-- TOC entry 3605 (class 1259 OID 16937)
-- Name: idx_procedimentos_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_procedimentos_ativo ON public.procedimentos_config USING btree (ativo);


--
-- TOC entry 3606 (class 1259 OID 16935)
-- Name: idx_procedimentos_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_procedimentos_tipo ON public.procedimentos_config USING btree (tipo);


--
-- TOC entry 3573 (class 1259 OID 16771)
-- Name: idx_prontuarios_numero; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prontuarios_numero ON public.prontuarios USING btree (numero_prontuario);


--
-- TOC entry 3574 (class 1259 OID 16770)
-- Name: idx_prontuarios_paciente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prontuarios_paciente ON public.prontuarios USING btree (paciente_id);


--
-- TOC entry 3647 (class 1259 OID 17201)
-- Name: idx_rate_identificador; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rate_identificador ON public.rate_limit_recuperacao USING btree (identificador);


--
-- TOC entry 3648 (class 1259 OID 17202)
-- Name: idx_rate_janela; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rate_janela ON public.rate_limit_recuperacao USING btree (janela_inicio);


--
-- TOC entry 3670 (class 2606 OID 16826)
-- Name: consentimentos_lgpd consentimentos_lgpd_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consentimentos_lgpd
    ADD CONSTRAINT consentimentos_lgpd_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- TOC entry 3657 (class 2606 OID 16414)
-- Name: consultas consultas_paciente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.consultas
    ADD CONSTRAINT consultas_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.usuarios(id);


--
-- TOC entry 3683 (class 2606 OID 17035)
-- Name: contas_pagar contas_pagar_criado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contas_pagar
    ADD CONSTRAINT contas_pagar_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.funcionarios(id);


--
-- TOC entry 3684 (class 2606 OID 17025)
-- Name: contas_pagar contas_pagar_funcionario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contas_pagar
    ADD CONSTRAINT contas_pagar_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES public.funcionarios(id);


--
-- TOC entry 3685 (class 2606 OID 17030)
-- Name: contas_pagar contas_pagar_orcamento_relacionado_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contas_pagar
    ADD CONSTRAINT contas_pagar_orcamento_relacionado_fkey FOREIGN KEY (orcamento_relacionado) REFERENCES public.orcamentos(id);


--
-- TOC entry 3680 (class 2606 OID 17006)
-- Name: contas_receber contas_receber_criado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contas_receber
    ADD CONSTRAINT contas_receber_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.funcionarios(id);


--
-- TOC entry 3681 (class 2606 OID 17001)
-- Name: contas_receber contas_receber_orcamento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contas_receber
    ADD CONSTRAINT contas_receber_orcamento_id_fkey FOREIGN KEY (orcamento_id) REFERENCES public.orcamentos(id);


--
-- TOC entry 3682 (class 2606 OID 16996)
-- Name: contas_receber contas_receber_paciente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contas_receber
    ADD CONSTRAINT contas_receber_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.pacientes(id);


--
-- TOC entry 3665 (class 2606 OID 16795)
-- Name: fichas_atendimento fichas_atendimento_agendamento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fichas_atendimento
    ADD CONSTRAINT fichas_atendimento_agendamento_id_fkey FOREIGN KEY (agendamento_id) REFERENCES public.agendamentos(id) ON DELETE SET NULL;


--
-- TOC entry 3666 (class 2606 OID 16805)
-- Name: fichas_atendimento fichas_atendimento_atualizado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fichas_atendimento
    ADD CONSTRAINT fichas_atendimento_atualizado_por_fkey FOREIGN KEY (atualizado_por) REFERENCES public.funcionarios(id);


--
-- TOC entry 3667 (class 2606 OID 16800)
-- Name: fichas_atendimento fichas_atendimento_criado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fichas_atendimento
    ADD CONSTRAINT fichas_atendimento_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.funcionarios(id);


--
-- TOC entry 3668 (class 2606 OID 16785)
-- Name: fichas_atendimento fichas_atendimento_paciente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fichas_atendimento
    ADD CONSTRAINT fichas_atendimento_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.pacientes(id) ON DELETE CASCADE;


--
-- TOC entry 3669 (class 2606 OID 16790)
-- Name: fichas_atendimento fichas_atendimento_prontuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fichas_atendimento
    ADD CONSTRAINT fichas_atendimento_prontuario_id_fkey FOREIGN KEY (prontuario_id) REFERENCES public.prontuarios(id) ON DELETE CASCADE;


--
-- TOC entry 3660 (class 2606 OID 16541)
-- Name: jornada_paciente jornada_paciente_criado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jornada_paciente
    ADD CONSTRAINT jornada_paciente_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.funcionarios(id);


--
-- TOC entry 3661 (class 2606 OID 16536)
-- Name: jornada_paciente jornada_paciente_paciente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jornada_paciente
    ADD CONSTRAINT jornada_paciente_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.pacientes(id);


--
-- TOC entry 3671 (class 2606 OID 16845)
-- Name: logs_exclusao_lgpd logs_exclusao_lgpd_executado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logs_exclusao_lgpd
    ADD CONSTRAINT logs_exclusao_lgpd_executado_por_fkey FOREIGN KEY (executado_por) REFERENCES public.funcionarios(id);


--
-- TOC entry 3662 (class 2606 OID 16564)
-- Name: notificacoes notificacoes_funcionario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes
    ADD CONSTRAINT notificacoes_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES public.funcionarios(id);


--
-- TOC entry 3663 (class 2606 OID 16559)
-- Name: notificacoes notificacoes_paciente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificacoes
    ADD CONSTRAINT notificacoes_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.pacientes(id);


--
-- TOC entry 3672 (class 2606 OID 16897)
-- Name: orcamentos orcamentos_atualizado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_atualizado_por_fkey FOREIGN KEY (atualizado_por) REFERENCES public.funcionarios(id);


--
-- TOC entry 3673 (class 2606 OID 16892)
-- Name: orcamentos orcamentos_criado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.funcionarios(id);


--
-- TOC entry 3674 (class 2606 OID 16887)
-- Name: orcamentos orcamentos_paciente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orcamentos
    ADD CONSTRAINT orcamentos_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.pacientes(id) ON DELETE CASCADE;


--
-- TOC entry 3659 (class 2606 OID 16519)
-- Name: pacientes pacientes_cadastrado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pacientes
    ADD CONSTRAINT pacientes_cadastrado_por_fkey FOREIGN KEY (cadastrado_por) REFERENCES public.funcionarios(id);


--
-- TOC entry 3686 (class 2606 OID 17063)
-- Name: pagamentos pagamentos_criado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT pagamentos_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.funcionarios(id);


--
-- TOC entry 3687 (class 2606 OID 17058)
-- Name: pagamentos pagamentos_orcamento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pagamentos
    ADD CONSTRAINT pagamentos_orcamento_id_fkey FOREIGN KEY (orcamento_id) REFERENCES public.orcamentos(id) ON DELETE CASCADE;


--
-- TOC entry 3678 (class 2606 OID 16979)
-- Name: procedimentos_acessorios procedimentos_acessorios_criado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedimentos_acessorios
    ADD CONSTRAINT procedimentos_acessorios_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.funcionarios(id);


--
-- TOC entry 3679 (class 2606 OID 16974)
-- Name: procedimentos_acessorios procedimentos_acessorios_procedimento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedimentos_acessorios
    ADD CONSTRAINT procedimentos_acessorios_procedimento_id_fkey FOREIGN KEY (procedimento_id) REFERENCES public.procedimentos_config(id) ON DELETE CASCADE;


--
-- TOC entry 3676 (class 2606 OID 16955)
-- Name: procedimentos_adicionais procedimentos_adicionais_criado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedimentos_adicionais
    ADD CONSTRAINT procedimentos_adicionais_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.funcionarios(id);


--
-- TOC entry 3677 (class 2606 OID 16950)
-- Name: procedimentos_adicionais procedimentos_adicionais_procedimento_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedimentos_adicionais
    ADD CONSTRAINT procedimentos_adicionais_procedimento_id_fkey FOREIGN KEY (procedimento_id) REFERENCES public.procedimentos_config(id) ON DELETE CASCADE;


--
-- TOC entry 3675 (class 2606 OID 16930)
-- Name: procedimentos_config procedimentos_config_criado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.procedimentos_config
    ADD CONSTRAINT procedimentos_config_criado_por_fkey FOREIGN KEY (criado_por) REFERENCES public.funcionarios(id);


--
-- TOC entry 3664 (class 2606 OID 16765)
-- Name: prontuarios prontuarios_paciente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.prontuarios
    ADD CONSTRAINT prontuarios_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.pacientes(id) ON DELETE CASCADE;


--
-- TOC entry 3658 (class 2606 OID 16461)
-- Name: user_profiles user_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.usuarios(id);


-- Completed on 2025-08-01 20:16:13 -03

--
-- PostgreSQL database dump complete
--

