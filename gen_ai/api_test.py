from google import genai
from google.genai import types
import pathlib
from dotenv import load_dotenv
import os
import json

PROMPT = """
Você é um extrator de dados de contas de luz altamente eficiente e preciso. Sua tarefa é analisar o arquivo PDF fornecido, que é uma conta de luz brasileira (fatura de energia elétrica), e extrair as informações solicitadas.

**Restrição de Saída:**
Sua resposta DEVE ser um objeto JSON **válido e completo**, aderindo estritamente ao esquema fornecido abaixo. Se um campo não for encontrado no documento, o valor correspondente DEVE ser uma string vazia ("").

**Esquema JSON Requerido:**

{
  "cliente": {
    "nome" : "", // Nome completo do cliente
    "endereco" : "", // Endereço completo da instalação
    "cpf_cnpj" : "", // CPF ou CNPJ do cliente
    "inscricao_estadual" : "", // Inscrição Estadual (se aplicável)
    "codigo_cliente" : "", // Código do Cliente/Unidade Consumidora
    "codigo_instalacao" : "", // Código de Instalação/Ponto de Consumo
    "classificacao" : "", // Classificação/Subclasse de Consumo (Ex: Residencial, Comercial)
    "ligacao" : "", // Tipo de Ligação (Ex: Monofásico, Bifásico, Trifásico)
    "grupo_tarifario" : "" // Grupo Tarifário (Ex: B1, A4, etc.)
  },
  "data_conta": {
    "leitura_anterior" : "", // Data da Leitura Anterior (formato DD/MM/AAAA)
    "leitura_atual" : "", // Data da Leitura Atual (formato DD/MM/AAAA)
    "n_dias" : "" // Número de dias de consumo (período de faturamento)
  },
  "conta": {
    "vencimento" : "", // Data de Vencimento da fatura (formato DD/MM/AAAA)
    "valor_total" : "", // Valor Total a Pagar (apenas números e ponto decimal, Ex: 123.45)
    "saldo_cliente" : "", // Saldo/Débitos Pendentes do cliente (apenas números e ponto decimal, Ex: 0.00)
    "demanda_ponta" : "", // Demanda Medida ou Contratada - Ponta (kWh ou kW)
    "demanda_fora_ponta" : "", // Demanda Medida ou Contratada - Fora Ponta (kWh ou kW)
    "demanda_tusdg" : "" // Demanda TUSDg ou Demanda Ativa Faturada
  },
  "estrutura_consumo": [ // Lista de objetos representando a estrutura de consumo, presente na seção com título "Estrutura de Consumo"
    {
      "unidade" : "", // Unidade de medida do consumo principal (Ex: kWh)
      "posto" : "", // Posto (Ex: Ponta, Fora Ponta)
      "medida_atual" : "", // Leitura Atual do Medidor
      "medido" : "", // Consumo Medido
      "faturado" : "" // Consumo Faturado (valor final utilizado para cálculo)
    }
  ],
  "imposto": [ // Lista com todos os dados dos impostos
    { 
      "tipo_imposto" : "", // Nome do imposto (Ex: ICMS)
      "base_calculo" : "", // Base de cálculo do imposto (apenas números e ponto decimal)
      "aliquota" : "", // Alíquota aplicada (apenas números e ponto decimal, Ex: 25.00)
      "valor" : "" // Valor total do imposto (apenas números e ponto decimal)
    }
  ],
  "medicao": [ // Lista de objetos representando os itens de medição/faturamento, presente logo abaixo do cabeçalho da conta, ao lado esquerdo das informações sobre impostos
    { 
      "item_fatura" : "", // Descrição do Item (Ex: Consumo em kWh, Energia Atv Injetada GDII)
      "unidade" : "", // Unidade de medida (Ex: kWh)
      "quantidade" : "", // Quantidade consumida/faturada (apenas números e ponto decimal)
      "preco_unit_trib" : "", // Preço Unitário (apenas números e ponto decimal)
      "valor" : "" // Valor total do item (apenas números e ponto decimal)
    }
  ]
}
"""

# Load environment variables from .env file
load_dotenv()
api_key = os.getenv("API_KEY")

client = genai.Client(api_key=api_key)

# Retrieve and encode the PDF byte
filepath = pathlib.Path('resources/pdf_test1.pdf')

response = client.models.generate_content(
  model="gemini-2.5-flash",
  contents=[
      types.Part.from_bytes(
        data=filepath.read_bytes(),
        mime_type='application/pdf',
      ),
      PROMPT])

print(response.text)

try:
  data = json.loads(response.text[8:-4])
  with open('output.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
  print("JSON file written successfully.")
except json.JSONDecodeError:
  print("response.text is not a valid JSON.")
