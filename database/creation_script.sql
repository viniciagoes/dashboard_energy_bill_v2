CREATE DATABASE dash;
CREATE SCHEMA energy_bill_dashboard;

CREATE TABLE IF NOT EXISTS energy_bill_dashboard.users (
	id int4 NOT NULL,
	username varchar NOT NULL,
	email varchar NOT NULL,
	"password" varchar NOT NULL,
	"role" varchar NOT NULL,
	status varchar DEFAULT 'pending'::character varying NULL,
	created_at timestamptz NULL,
	last_login timestamptz NULL,
	CONSTRAINT users_pk PRIMARY KEY (id)
);


-- Criando tabelas apenas se não existirem
CREATE TABLE IF NOT EXISTS energy_bill_dashboard.dim_cliente (
    id                 SERIAL PRIMARY KEY,
    nome               VARCHAR(100),
    endereco           VARCHAR(250),
    cpf_cnpj           VARCHAR(14),
    insc_est           VARCHAR(9),
    codigo_cliente     VARCHAR(15) UNIQUE,
    codigo_instalacao  VARCHAR(15) UNIQUE,
    classificacao      VARCHAR(100),
    ligacao            VARCHAR(20),
    grupo_tarifario    VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS energy_bill_dashboard.dim_data_conta (
    id               SERIAL PRIMARY KEY,
    leitura_anterior DATE,
    leitura_atual    DATE,
    n_dias          INTEGER,
    latual_ano      INTEGER,
    latual_mes      INTEGER,
    latual_dia      INTEGER,
    lant_ano       INTEGER,
    lant_mes       INTEGER,
    lant_dia       INTEGER
);

CREATE TABLE IF NOT EXISTS energy_bill_dashboard.fato_conta (
    id            SERIAL PRIMARY KEY,
    id_cliente    INTEGER NOT NULL,
    id_data       INTEGER NOT NULL,
    vencimento       DATE,
    valor_total   NUMERIC,
    saldo_cliente NUMERIC,
    demanda_ponta      INTEGER,
    demanda_fora_ponta INTEGER,
    demanda_tusdg      INTEGER
);

CREATE TABLE IF NOT EXISTS energy_bill_dashboard.fato_estrutura_consumo (
    id           SERIAL PRIMARY KEY,
    conta_id     INTEGER NOT NULL,
    unidade      VARCHAR(5),
    posto        VARCHAR(10),
    medida_atual NUMERIC,
    medido       NUMERIC,
    faturado     NUMERIC
);

CREATE TABLE IF NOT EXISTS energy_bill_dashboard.fato_imposto (
    id           SERIAL PRIMARY KEY,
    conta_id     INTEGER NOT NULL,
    tipo_imposto VARCHAR(10),
    base_calculo NUMERIC,
    aliquota     NUMERIC,
    valor        NUMERIC
);

CREATE TABLE IF NOT EXISTS energy_bill_dashboard.fato_medicao (
    id              SERIAL PRIMARY KEY,
    conta_id        INTEGER NOT NULL,
    item_fatura     VARCHAR(50),
    unidade         VARCHAR(5),
    quantidade      NUMERIC,
    preco_unit_trib NUMERIC,
    valor           NUMERIC
);

-- Criando constraints apenas se não existirem
ALTER TABLE energy_bill_dashboard.fato_conta
    ADD CONSTRAINT FK_dim_cliente_TO_fato_conta
    FOREIGN KEY (id_cliente)
    REFERENCES energy_bill_dashboard.dim_cliente (id) ON DELETE CASCADE;

ALTER TABLE energy_bill_dashboard.fato_conta
    ADD CONSTRAINT FK_dim_data_conta_TO_fato_conta
    FOREIGN KEY (id_data)
    REFERENCES energy_bill_dashboard.dim_data_conta (id) ON DELETE CASCADE;

ALTER TABLE energy_bill_dashboard.fato_medicao
    ADD CONSTRAINT FK_fato_conta_TO_fato_medicao
    FOREIGN KEY (conta_id)
    REFERENCES energy_bill_dashboard.fato_conta (id) ON DELETE CASCADE;

ALTER TABLE energy_bill_dashboard.fato_imposto
    ADD CONSTRAINT FK_fato_conta_TO_fato_imposto
    FOREIGN KEY (conta_id)
    REFERENCES energy_bill_dashboard.fato_conta (id) ON DELETE CASCADE;

ALTER TABLE energy_bill_dashboard.fato_estrutura_consumo
    ADD CONSTRAINT FK_fato_conta_TO_fato_estrutura_consumo
    FOREIGN KEY (conta_id)
    REFERENCES energy_bill_dashboard.fato_conta (id) ON DELETE CASCADE;