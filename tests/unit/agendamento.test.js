// tests/unit/agendamento.test.js
const request = require('supertest');
const app = require('../../src/App');
const { Pool } = require('pg');

describe('Agendamento Controller', () => {
  let db;
  let authToken;

  beforeAll(async () => {
    db = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
    
    // Criar usuário de teste e obter token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@test.com',
        password: 'testpassword'
      });
    
    authToken = loginResponse.body.token;
  });

  afterAll(async () => {
    await db.end();
  });

  beforeEach(async () => {
    // Limpar dados de teste
    await db.query('DELETE FROM agendamentos WHERE paciente_id IN (SELECT id FROM usuarios WHERE email LIKE \'%test%\')');
  });

  describe('POST /api/agendamentos', () => {
    it('deve criar um novo agendamento com dados válidos', async () => {
      const agendamentoData = {
        paciente_id: 'test-patient-id',
        servico_id: 'test-service-id',
        data_agendamento: '2024-12-25T10:00:00.000Z',
        observacoes: 'Teste de agendamento'
      };

      const response = await request(app)
        .post('/api/agendamentos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(agendamentoData)
        .expect(201);

      expect(response.body.sucesso).toBe(true);
      expect(response.body.agendamento).toHaveProperty('id');
      expect(response.body.agendamento.status).toBe('agendado');
    });

    it('deve retornar erro 409 para horário já ocupado', async () => {
      const agendamentoData = {
        paciente_id: 'test-patient-id',
        servico_id: 'test-service-id',
        data_agendamento: '2024-12-25T10:00:00.000Z'
      };

      // Criar primeiro agendamento
      await request(app)
        .post('/api/agendamentos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(agendamentoData);

      // Tentar criar segundo agendamento no mesmo horário
      const response = await request(app)
        .post('/api/agendamentos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(agendamentoData)
        .expect(409);

      expect(response.body.erro).toBe('Horário não disponível');
    });

    it('deve validar dados obrigatórios', async () => {
      const response = await request(app)
        .post('/api/agendamentos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('deve verificar LGPD - consentimento para coleta de dados', async () => {
      const agendamentoData = {
        paciente_id: 'test-patient-id',
        servico_id: 'test-service-id',
        data_agendamento: '2024-12-25T10:00:00.000Z',
        lgpd_consentimento: true
      };

      const response = await request(app)
        .post('/api/agendamentos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(agendamentoData)
        .expect(201);

      // Verificar se o log LGPD foi criado
      const lgpdLog = await db.query(
        'SELECT * FROM lgpd_logs WHERE acao = $1 AND usuario_id = $2',
        ['agendamento_criado', 'test-patient-id']
      );
      
      expect(lgpdLog.rows.length).toBe(1);
    });
  });

  describe('GET /api/agendamentos/disponibilidade', () => {
    it('deve retornar slots disponíveis', async () => {
      const response = await request(app)
        .get('/api/agendamentos/disponibilidade')
        .query({
          data_inicio: '2024-12-25',
          data_fim: '2024-12-26'
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('inicio');
      expect(response.body[0]).toHaveProperty('fim');
      expect(response.body[0]).toHaveProperty('disponivel');
    });

    it('deve respeitar horários de funcionamento', async () => {
      const response = await request(app)
        .get('/api/agendamentos/disponibilidade')
        .query({
          data_inicio: '2024-12-25',
          data_fim: '2024-12-25'
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verificar se não há slots antes das 8h ou depois das 18h
      const slotsForaHorario = response.body.filter(slot => {
        const hora = new Date(slot.inicio).getHours();
        return hora < 8 || hora >= 18;
      });

      expect(slotsForaHorario.length).toBe(0);
    });
  });

  describe('PUT /api/agendamentos/:id', () => {
    it('deve atualizar um agendamento existente', async () => {
      // Primeiro criar um agendamento
      const agendamentoData = {
        paciente_id: 'test-patient-id',
        servico_id: 'test-service-id',
        data_agendamento: '2024-12-25T10:00:00.000Z'
      };

      const createResponse = await request(app)
        .post('/api/agendamentos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(agendamentoData);

      const agendamentoId = createResponse.body.agendamento.id;

      // Atualizar o agendamento
      const updateData = {
        data_agendamento: '2024-12-25T14:00:00.000Z',
        observacoes: 'Agendamento atualizado'
      };

      const response = await request(app)
        .put(`/api/agendamentos/${agendamentoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.sucesso).toBe(true);
      expect(response.body.agendamento.observacoes).toBe('Agendamento atualizado');
    });
  });

  describe('DELETE /api/agendamentos/:id', () => {
    it('deve cancelar um agendamento', async () => {
      // Criar agendamento para cancelar
      const agendamentoData = {
        paciente_id: 'test-patient-id',
        servico_id: 'test-service-id',
        data_agendamento: '2024-12-25T10:00:00.000Z'
      };

      const createResponse = await request(app)
        .post('/api/agendamentos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(agendamentoData);

      const agendamentoId = createResponse.body.agendamento.id;

      // Cancelar agendamento
      const response = await request(app)
        .delete(`/api/agendamentos/${agendamentoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.sucesso).toBe(true);
      expect(response.body.agendamento.status).toBe('cancelado');
    });
  });
});
