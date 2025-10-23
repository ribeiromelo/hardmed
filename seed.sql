-- Insert admin user (password: admin123)
INSERT OR IGNORE INTO users (id, name, email, password_hash, role) VALUES 
  (1, 'Admin HardMed', 'admin@hardmedicina.com', '$2a$10$rGXqLw3p7xPgkH8zQqBq7eYJKvJvF7K8hI9gX6KyQ9rX5qF8mN8pe', 'admin'),
  (2, 'Dr. Erique Silva', 'erique@exemplo.com', '$2a$10$rGXqLw3p7xPgkH8zQqBq7eYJKvJvF7K8hI9gX6KyQ9rX5qF8mN8pe', 'student');

-- Insert specialties
INSERT OR IGNORE INTO specialties (id, name, slug, description, cover_image, icon, order_index) VALUES 
  (1, 'Cardiologia', 'cardiologia', 'Do IAM à IC crônica, tudo que o emergencista precisa.', '/static/images/cardiologia.jpg', 'fa-heart-pulse', 1),
  (2, 'Nefrologia', 'nefrologia', 'Distúrbios hidroeletrolíticos e insuficiência renal.', '/static/images/nefrologia.jpg', 'fa-droplet', 2),
  (3, 'Clínica Médica', 'clinica', 'Fundamentos da medicina interna e casos clínicos.', '/static/images/clinica.jpg', 'fa-stethoscope', 3),
  (4, 'Cirurgia', 'cirurgia', 'Técnicas cirúrgicas e emergências cirúrgicas.', '/static/images/cirurgia.jpg', 'fa-scissors', 4),
  (5, 'Ginecologia', 'ginecologia', 'Saúde da mulher e obstetrícia.', '/static/images/ginecologia.jpg', 'fa-person-dress', 5),
  (6, 'Pediatria', 'pediatria', 'Cuidados pediátricos e desenvolvimento infantil.', '/static/images/pediatria.jpg', 'fa-child', 6);

-- Insert tracks
INSERT OR IGNORE INTO tracks (id, specialty_id, title, slug, description, cover_image, total_lessons, duration_minutes, order_index) VALUES 
  (1, 1, 'Emergências Cardiovasculares', 'emergencias-cardiovasculares', 'Manejo de IAM, arritmias e choque cardiogênico.', '/static/images/track-cardio-emergencias.jpg', 41, 2460, 1),
  (2, 1, 'Insuficiência Cardíaca', 'insuficiencia-cardiaca', 'Fisiopatologia, diagnóstico e tratamento da IC.', '/static/images/track-ic.jpg', 15, 900, 2),
  (3, 2, 'Distúrbios Hidroeletrolíticos', 'disturbios-hidreletroliticos', 'Sódio, potássio e equilíbrio ácido-base.', '/static/images/track-hidro.jpg', 20, 1200, 1),
  (4, 3, 'Medicina de Emergência', 'medicina-emergencia', 'Protocolos de atendimento em situações críticas.', '/static/images/track-emergencia.jpg', 35, 2100, 1);

-- Insert seasons for track 1 (Emergências Cardiovasculares)
INSERT OR IGNORE INTO seasons (id, track_id, title, description, order_index) VALUES 
  (1, 1, 'Temporada 1: Síndromes Coronarianas', 'IAM, angina instável e estratificação de risco.', 1),
  (2, 1, 'Temporada 2: Arritmias e Fibrilação Atrial', 'Manejo de arritmias agudas e FA.', 2),
  (3, 1, 'Temporada 3: IC e Choque Cardiogênico', 'Tratamento da insuficiência cardíaca descompensada.', 3);

-- Insert seasons for track 4 (Medicina de Emergência)
INSERT OR IGNORE INTO seasons (id, track_id, title, description, order_index) VALUES 
  (4, 4, 'Temporada 1: Atendimento ao Politrauma', 'ATLS e manejo inicial do trauma.', 1),
  (5, 4, 'Temporada 2: Emergências Toxicológicas', 'Intoxicações e antídotos.', 2);

-- Insert lessons
INSERT OR IGNORE INTO lessons (id, season_id, title, slug, description, video_url, duration_minutes, pdf_url, order_index, key_points) VALUES 
  (1, 1, 'Infarto Agudo do Miocárdio - Diagnóstico', 'iam-diagnostico', 'Aprenda a identificar um IAM pelos critérios clínicos e laboratoriais.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 45, '/static/pdfs/iam-diagnostico.pdf', 1, '["Critérios diagnósticos", "ECG de 12 derivações", "Marcadores cardíacos", "Estratificação de risco"]'),
  (2, 1, 'IAM - Tratamento na Emergência', 'iam-tratamento', 'Protocolo de reperfusão e medicações no IAM.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 50, '/static/pdfs/iam-tratamento.pdf', 2, '["Dupla antiagregação", "Anticoagulação", "Trombolíticos", "Angioplastia primária"]'),
  (3, 1, 'Angina Instável e SCASST', 'angina-instavel', 'Diferenciação entre angina instável e IAM sem supra de ST.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 40, '/static/pdfs/angina-instavel.pdf', 3, '["Critérios GRACE", "Estratificação de risco", "Conduta conservadora vs invasiva"]'),
  (4, 2, 'Fibrilação Atrial Aguda', 'fa-aguda', 'Manejo da FA com instabilidade hemodinâmica.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 35, '/static/pdfs/fa-aguda.pdf', 1, '["Cardioversão elétrica", "Controle de frequência", "Anticoagulação"]'),
  (5, 2, 'Taquiarritmias Supraventriculares', 'taquiarritmias-supra', 'TSV paroxística e manobras vagais.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 38, '/static/pdfs/taquiarritmias.pdf', 2, '["Manobra de Valsalva", "Adenosina", "Bloqueadores de canal de cálcio"]'),
  (6, 3, 'Choque Cardiogênico', 'choque-cardiogenico', 'Fisiopatologia e suporte hemodinâmico no choque.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 55, '/static/pdfs/choque-cardiogenico.pdf', 1, '["Definição e critérios", "Drogas vasoativas", "Balão intra-aórtico", "ECMO"]'),
  (7, 3, 'Edema Agudo de Pulmão', 'edema-agudo-pulmao', 'Tratamento do EAP cardiogênico.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 42, '/static/pdfs/eap.pdf', 2, '["Diuréticos de alça", "Vasodilatadores", "VNI", "Morfina"]'),
  (8, 4, 'ATLS - Avaliação Inicial', 'atls-avaliacao', 'Protocolo ABCDE no politrauma.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 60, '/static/pdfs/atls.pdf', 1, '["Via aérea", "Breathing", "Circulação", "Disability", "Exposure"]'),
  (9, 4, 'Trauma Craniencefálico', 'tce', 'Manejo do TCE grave e Glasgow.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 48, '/static/pdfs/tce.pdf', 2, '["Escala de coma de Glasgow", "Hipertensão intracraniana", "Indicações cirúrgicas"]'),
  (10, 5, 'Intoxicação por Paracetamol', 'intoxicacao-paracetamol', 'Antídoto e manejo da hepatotoxicidade.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 35, '/static/pdfs/paracetamol.pdf', 1, '["N-acetilcisteína", "Nomograma de Rumack-Matthew", "Critérios de transplante"]');

-- Insert user progress
INSERT OR IGNORE INTO user_track_progress (user_id, track_id, completed_lessons, total_lessons, progress_percentage, last_lesson_id) VALUES 
  (2, 4, 4, 41, 9.8, 8);

INSERT OR IGNORE INTO user_lesson_progress (user_id, lesson_id, is_completed, watch_time_seconds) VALUES 
  (2, 8, 1, 3600),
  (2, 9, 1, 2880),
  (2, 1, 1, 2700),
  (2, 2, 0, 1200);

INSERT OR IGNORE INTO user_favorites (user_id, lesson_id) VALUES 
  (2, 1),
  (2, 6);
