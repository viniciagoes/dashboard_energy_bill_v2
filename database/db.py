import os
from passlib.hash import sha256_crypt
from sqlalchemy import create_engine, Column, Integer, String, Date, Numeric, ForeignKey, DateTime
from sqlalchemy.orm import Session, declarative_base, sessionmaker, relationship
from sqlalchemy.sql import func
from dotenv import load_dotenv

# Define constants by loading environment variables
load_dotenv(".env")
DATABASE_URL = os.getenv("DATABASE_URL")

# Database setup
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()   

# region Classes for Tables

# Table users
class User(Base):
    __tablename__ = 'users'
    __table_args__ = {'schema': 'energy_bill_dashboard'}

    id = Column(Integer, primary_key=True)
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(256), nullable=False)
    role = Column(String(10), nullable=False)
    status = Column(String(10), default='pending')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True))

class Clientes(Base):
    __tablename__ = 'dim_cliente'
    __table_args__ = {'schema': 'energy_bill_dashboard'}

    id = Column(Integer, primary_key=True)
    nome = Column(String(100))
    endereco = Column(String(250))
    cpf_cnpj = Column(String(14))
    insc_est = Column(String(9))
    codigo_cliente = Column(String(15), unique=True)
    codigo_instalacao = Column(String(15), unique=True)
    classificacao = Column(String(100))
    ligacao = Column(String(20))
    grupo_tarifario = Column(String(50))

    contas = relationship("Contas", back_populates="cliente", cascade="all, delete-orphan")


class dataConta(Base):
    __tablename__ = 'dim_data_conta'
    __table_args__ = {'schema': 'energy_bill_dashboard'}

    id = Column(Integer, primary_key=True)
    leitura_anterior = Column(Date)
    leitura_atual = Column(Date)
    n_dias = Column(Integer)
    latual_ano = Column(Integer)
    latual_mes = Column(Integer)
    latual_dia = Column(Integer)
    lant_ano = Column(Integer)
    lant_mes = Column(Integer)
    lant_dia = Column(Integer)

    contas = relationship("Contas", back_populates="data_conta", cascade="all, delete-orphan")


class Contas(Base):
    __tablename__ = 'fato_conta'
    __table_args__ = {'schema': 'energy_bill_dashboard'}

    id = Column(Integer, primary_key=True)
    id_cliente = Column(Integer, ForeignKey('energy_bill_dashboard.dim_cliente.id', ondelete='CASCADE'), nullable=False)
    id_data = Column(Integer, ForeignKey('energy_bill_dashboard.dim_data_conta.id', ondelete='CASCADE'), nullable=False)
    vencimento = Column(Date)
    valor_total = Column(Numeric)
    saldo_cliente = Column(Numeric)
    demanda_ponta = Column(Integer)
    demanda_fora_ponta = Column(Integer)
    demanda_tusdg = Column(Integer)

    cliente = relationship("Clientes", back_populates="contas")
    data_conta = relationship("dataConta", back_populates="contas")
    medicoes = relationship("Medicao", back_populates="conta", cascade="all, delete-orphan")
    impostos = relationship("Imposto", back_populates="conta", cascade="all, delete-orphan")
    estrutura_consumo = relationship("estruturaConsumo", back_populates="conta", cascade="all, delete-orphan")


class estruturaConsumo(Base):
    __tablename__ = 'fato_estrutura_consumo'
    __table_args__ = {'schema': 'energy_bill_dashboard'}

    id = Column(Integer, primary_key=True)
    conta_id = Column(Integer, ForeignKey('energy_bill_dashboard.fato_conta.id', ondelete='CASCADE'), nullable=False)
    unidade = Column(String(5))
    posto = Column(String(10))
    medida_atual = Column(Numeric)
    medido = Column(Numeric)
    faturado = Column(Numeric)

    conta = relationship("Contas", back_populates="estrutura_consumo")


class Imposto(Base):
    __tablename__ = 'fato_imposto'
    __table_args__ = {'schema': 'energy_bill_dashboard'}

    id = Column(Integer, primary_key=True)
    conta_id = Column(Integer, ForeignKey('energy_bill_dashboard.fato_conta.id', ondelete='CASCADE'), nullable=False)
    tipo_imposto = Column(String(10))
    base_calculo = Column(Numeric)
    aliquota = Column(Numeric)
    valor = Column(Numeric)

    conta = relationship("Contas", back_populates="impostos")


class Medicao(Base):
    __tablename__ = 'fato_medicao'
    __table_args__ = {'schema': 'energy_bill_dashboard'}

    id = Column(Integer, primary_key=True)
    conta_id = Column(Integer, ForeignKey('energy_bill_dashboard.fato_conta.id', ondelete='CASCADE'), nullable=False)
    item_fatura = Column(String(50))
    unidade = Column(String(5))
    quantidade = Column(Numeric)
    preco_unit_trib = Column(Numeric)
    valor = Column(Numeric)

    conta = relationship("Contas", back_populates="medicoes")

# endregion

# region Functions for API

# Auth user with hashing password
def authenticate_user(session: Session, email: str, password: str):
    """function for authenticate user

    Args:
        session (Session): local db session
        email (str): email from form data
        password (str): email from form data

    Returns:
        _type_: _description_
    """
    user = session.query(User).filter(User.email == email).first()

    if not user:
        return None, "User not found"
    
    if not sha256_crypt.verify(password, user.password):
        return None, "Incorrect password"
    
    if user.status == "pending":
        return None, "Your account is pending admin approval"
    
    if user.status == "rejected":
        return None, "Your account has been rejected. Contact administrator."
    
    return user, None

def register_user(session: Session, username: str, email: str, password: str, role: str = "user"):
    """Register a new user

    Args:
        session (Session): local db session
        username (str): username from form data
        email (str): email from form data
        password (str): password from form data
        role (str): user role, default 'user'

    Returns:
        _type_: _description_
    """
    if session.query(User).filter((User.username == username) | (User.email == email)).first():
        return None, "Username or email already exists"

    hashed_password = sha256_crypt.hash(password)
    new_user = User(
        username=username,
        email=email,
        password=hashed_password,
        role=role,
        status="pending"
    )
    session.add(new_user)
    session.commit()
    return new_user, None

def update_user_status(session: Session, user_id: int, status: str):
    """
    Approve or deny user registration by updating status.

    Args:
        session (Session): local db session
        user_id (int): user id
        status (str): 'approved' or 'rejected'

    Returns:
        _type_: _description_
    """
    user = session.query(User).filter(User.id == user_id).first()
    if not user:
        return None, "User not found"
    if status not in ["approved", "rejected"]:
        return None, "Invalid status"
    user.status = status
    session.commit()
    return user, None

def get_all_clientes(session: Session):
    """Get all clients for usage in filters

    Args:
        session (Session): local db session

    Returns:
        _type_: _description_
    """
    return session.query(Clientes.id, Clientes.nome).all()

def insert_new_bill(
    session: Session,
    cliente_id: int,
    conta_data: dict,
    data_conta_data: dict,
    impostos_data: list,
    medicoes_data: list,
    estruturas_data: list
):
    # Check if dataConta exists
    data_conta = session.query(dataConta).filter_by(
        leitura_anterior=data_conta_data.get("leitura_anterior"),
        leitura_atual=data_conta_data.get("leitura_atual"),
        n_dias=data_conta_data.get("n_dias"),
        latual_ano=data_conta_data.get("latual_ano"),
        latual_mes=data_conta_data.get("latual_mes"),
        latual_dia=data_conta_data.get("latual_dia"),
        lant_ano=data_conta_data.get("lant_ano"),
        lant_mes=data_conta_data.get("lant_mes"),
        lant_dia=data_conta_data.get("lant_dia")
    ).first()
    if not data_conta:
        data_conta = dataConta(**data_conta_data)
        session.add(data_conta)
        session.flush()  # get id

    # Create new Contas
    conta = Contas(
        id_cliente=cliente_id,
        id_data=data_conta.id,
        vencimento=conta_data.get("vencimento"),
        valor_total=conta_data.get("valor_total"),
        saldo_cliente=conta_data.get("saldo_cliente"),
        demanda_ponta=conta_data.get("demanda_ponta"),
        demanda_fora_ponta=conta_data.get("demanda_fora_ponta"),
        demanda_tusdg=conta_data.get("demanda_tusdg")
    )
    session.add(conta)
    session.flush()  # get id

    # Add impostos
    for imposto_dict in impostos_data:
        imposto = Imposto(conta_id=conta.id, **imposto_dict)
        session.add(imposto)

    # Add medicoes
    for medicao_dict in medicoes_data:
        medicao = Medicao(conta_id=conta.id, **medicao_dict)
        session.add(medicao)

    # Add estruturas
    for estrutura_dict in estruturas_data:
        estrutura = estruturaConsumo(conta_id=conta.id, **estrutura_dict)
        session.add(estrutura)

    session.commit()
    return conta.id

# endregion

#if __name__ == "__main__":
#    with SessionLocal() as session:
#        print(f"{session.query(Contas).first().id}")