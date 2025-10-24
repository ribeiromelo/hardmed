-- Insert admin user (password: admin123)
INSERT OR IGNORE INTO users (id, name, email, password_hash, role) VALUES 
  (1, 'Admin HardMed', 'admin@hardmedicina.com', '7fe29ccd6ed500c17f1c5afbb9f86f592670e2846e09deb3c74359fc5220c5ef', 'admin'),
  (2, 'Dr. Erique Silva', 'erique@exemplo.com', '7fe29ccd6ed500c17f1c5afbb9f86f592670e2846e09deb3c74359fc5220c5ef', 'student');

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
  (1, 1, 'Emergências Cardiovasculares', 'emergencias-cardiovasculares', 'Manejo de IAM, arritmias e choque cardiogênico.', '/static/images/track-cardio-emergencias.jpg', 10, 600, 1),
  (2, 1, 'Insuficiência Cardíaca', 'insuficiencia-cardiaca', 'Fisiopatologia, diagnóstico e tratamento da IC.', '/static/images/track-ic.jpg', 8, 480, 2),
  (3, 1, 'Hipertensão Arterial Sistêmica', 'hipertensao-arterial', 'Manejo ambulatorial e emergencial da HAS.', '/static/images/track-has.jpg', 6, 360, 3),
  (4, 2, 'Distúrbios Hidroeletrolíticos', 'disturbios-hidreletroliticos', 'Sódio, potássio e equilíbrio ácido-base.', '/static/images/track-hidro.jpg', 12, 720, 1),
  (5, 2, 'Insuficiência Renal Aguda', 'insuficiencia-renal-aguda', 'IRA pré-renal, renal e pós-renal.', '/static/images/track-ira.jpg', 8, 480, 2),
  (6, 3, 'Medicina de Emergência', 'medicina-emergencia', 'Protocolos de atendimento em situações críticas.', '/static/images/track-emergencia.jpg', 15, 900, 1),
  (7, 3, 'Endocrinologia na Prática', 'endocrinologia-pratica', 'Diabetes, tireoide e distúrbios metabólicos.', '/static/images/track-endo.jpg', 10, 600, 2),
  (8, 4, 'Abdome Agudo', 'abdome-agudo', 'Diagnóstico diferencial e indicações cirúrgicas.', '/static/images/track-abdome.jpg', 7, 420, 1),
  (9, 4, 'Trauma', 'trauma', 'ATLS e manejo do politrauma.', '/static/images/track-trauma.jpg', 9, 540, 2),
  (10, 5, 'Ginecologia de Emergência', 'ginecologia-emergencia', 'DIP, gravidez ectópica e complicações obstétricas.', '/static/images/track-gine.jpg', 8, 480, 1),
  (11, 6, 'Pediatria Essencial', 'pediatria-essencial', 'Principais patologias pediátricas.', '/static/images/track-ped.jpg', 10, 600, 1);

-- Insert seasons for track 1 (Emergências Cardiovasculares)
INSERT OR IGNORE INTO seasons (id, track_id, title, description, order_index) VALUES 
  (1, 1, 'Temporada 1: Síndromes Coronarianas', 'IAM, angina instável e estratificação de risco.', 1),
  (2, 1, 'Temporada 2: Arritmias e Fibrilação Atrial', 'Manejo de arritmias agudas e FA.', 2);

-- Insert seasons for track 2 (Insuficiência Cardíaca)
INSERT OR IGNORE INTO seasons (id, track_id, title, description, order_index) VALUES 
  (3, 2, 'Temporada 1: IC Aguda', 'Edema agudo de pulmão e choque cardiogênico.', 1);

-- Insert seasons for track 4 (Distúrbios Hidroeletrolíticos)
INSERT OR IGNORE INTO seasons (id, track_id, title, description, order_index) VALUES 
  (4, 4, 'Temporada 1: Distúrbios do Sódio', 'Hiponatremia e hipernatremia.', 1),
  (5, 4, 'Temporada 2: Distúrbios do Potássio', 'Hipocalemia e hipercalemia.', 2);

-- Insert seasons for track 6 (Medicina de Emergência)
INSERT OR IGNORE INTO seasons (id, track_id, title, description, order_index) VALUES 
  (6, 6, 'Temporada 1: Atendimento ao Politrauma', 'ATLS e manejo inicial do trauma.', 1),
  (7, 6, 'Temporada 2: Emergências Toxicológicas', 'Intoxicações e antídotos.', 2);

-- Insert seasons for track 9 (Trauma)
INSERT OR IGNORE INTO seasons (id, track_id, title, description, order_index) VALUES 
  (8, 9, 'Temporada 1: ATLS', 'Advanced Trauma Life Support.', 1);

-- Insert lessons
INSERT OR IGNORE INTO lessons (id, season_id, title, slug, description, video_url, duration_minutes, pdf_url, order_index, key_points) VALUES 
  -- Track 1 - Emergências Cardiovasculares
  (1, 1, 'Infarto Agudo do Miocárdio - Diagnóstico', 'iam-diagnostico', 'Aprenda a identificar um IAM pelos critérios clínicos e laboratoriais.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 45, '/static/pdfs/iam-diagnostico.pdf', 1, '["Critérios diagnósticos", "ECG de 12 derivações", "Marcadores cardíacos", "Estratificação de risco"]'),
  (2, 1, 'IAM - Tratamento na Emergência', 'iam-tratamento', 'Protocolo de reperfusão e medicações no IAM.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 50, '/static/pdfs/iam-tratamento.pdf', 2, '["Dupla antiagregação", "Anticoagulação", "Trombolíticos", "Angioplastia primária"]'),
  (3, 1, 'Angina Instável e SCASST', 'angina-instavel', 'Diferenciação entre angina instável e IAM sem supra de ST.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 40, '/static/pdfs/angina-instavel.pdf', 3, '["Critérios GRACE", "Estratificação de risco", "Conduta conservadora vs invasiva"]'),
  (4, 1, 'Estratificação de Risco Cardiovascular', 'estratificacao-risco', 'Scores de risco e indicação de cateterismo.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 35, '/static/pdfs/estratificacao.pdf', 4, '["Score TIMI", "Score GRACE", "Biomarcadores"]'),
  (5, 2, 'Fibrilação Atrial Aguda', 'fa-aguda', 'Manejo da FA com instabilidade hemodinâmica.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 35, '/static/pdfs/fa-aguda.pdf', 1, '["Cardioversão elétrica", "Controle de frequência", "Anticoagulação"]'),
  (6, 2, 'Taquiarritmias Supraventriculares', 'taquiarritmias-supra', 'TSV paroxística e manobras vagais.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 38, '/static/pdfs/taquiarritmias.pdf', 2, '["Manobra de Valsalva", "Adenosina", "Bloqueadores de canal de cálcio"]'),
  (7, 2, 'Taquicardia Ventricular', 'tv', 'TV sustentada e não sustentada.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 40, '/static/pdfs/tv.pdf', 3, '["Amiodarona", "Cardioversão", "Desfibrilação"]'),
  (8, 2, 'Bradicardia e Bloqueios', 'bradicardia', 'Bloqueios AV e indicação de marcapasso.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 42, '/static/pdfs/bradicardia.pdf', 4, '["BAV graus", "Atropina", "Marcapasso transcutâneo"]'),
  
  -- Track 2 - IC
  (9, 3, 'Edema Agudo de Pulmão', 'edema-agudo-pulmao', 'Tratamento do EAP cardiogênico.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 42, '/static/pdfs/eap.pdf', 1, '["Diuréticos de alça", "Vasodilatadores", "VNI", "Morfina"]'),
  (10, 3, 'Choque Cardiogênico', 'choque-cardiogenico', 'Fisiopatologia e suporte hemodinâmico no choque.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 55, '/static/pdfs/choque-cardiogenico.pdf', 2, '["Definição e critérios", "Drogas vasoativas", "Balão intra-aórtico", "ECMO"]'),
  (11, 3, 'IC Crônica Descompensada', 'ic-descompensada', 'Manejo ambulatorial da IC.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 38, '/static/pdfs/ic-cronica.pdf', 3, '["IECA/BRA", "Beta-bloqueadores", "Diuréticos"]'),
  
  -- Track 4 - Distúrbios Hidroeletrolíticos
  (12, 4, 'Hiponatremia', 'hiponatremia', 'Causas e correção segura da hiponatremia.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 45, '/static/pdfs/hiponatremia.pdf', 1, '["Osmolaridade", "SIADH", "Correção gradual", "Mielinólise"]'),
  (13, 4, 'Hipernatremia', 'hipernatremia', 'Diabetes insipidus e correção de hipernatremia.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 40, '/static/pdfs/hipernatremia.pdf', 2, '["DI central vs nefrogênico", "Reposição hídrica"]'),
  (14, 5, 'Hipocalemia', 'hipocalemia', 'Reposição de potássio e complicações.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 35, '/static/pdfs/hipocalemia.pdf', 1, '["Causas", "ECG", "Reposição venosa"]'),
  (15, 5, 'Hipercalemia', 'hipercalemia', 'Emergência hipercalêmica e tratamento.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 38, '/static/pdfs/hipercalemia.pdf', 2, '["Gluconato de cálcio", "Insulina", "Resinas", "Diálise"]'),
  
  -- Track 6 - Medicina de Emergência
  (16, 6, 'ATLS - Avaliação Inicial', 'atls-avaliacao', 'Protocolo ABCDE no politrauma.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 60, '/static/pdfs/atls.pdf', 1, '["Via aérea", "Breathing", "Circulação", "Disability", "Exposure"]'),
  (17, 6, 'Trauma Craniencefálico', 'tce', 'Manejo do TCE grave e Glasgow.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 48, '/static/pdfs/tce.pdf', 2, '["Escala de coma de Glasgow", "Hipertensão intracraniana", "Indicações cirúrgicas"]'),
  (18, 6, 'Trauma Torácico', 'trauma-toracico', 'Pneumotórax e hemotórax.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 45, '/static/pdfs/trauma-torax.pdf', 3, '["Drenagem torácica", "Tamponamento cardíaco"]'),
  (19, 7, 'Intoxicação por Paracetamol', 'intoxicacao-paracetamol', 'Antídoto e manejo da hepatotoxicidade.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 35, '/static/pdfs/paracetamol.pdf', 1, '["N-acetilcisteína", "Nomograma de Rumack-Matthew", "Critérios de transplante"]'),
  (20, 7, 'Intoxicação por Organofosforados', 'intox-organofosforados', 'Síndrome colinérgica e tratamento.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 40, '/static/pdfs/organofosforados.pdf', 2, '["Atropina", "Pralidoxima", "Sinais colinérgicos"]'),
  
  -- Track 9 - Trauma
  (21, 8, 'Via Aérea Definitiva', 'via-aerea-definitiva', 'Intubação e via aérea cirúrgica.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 50, '/static/pdfs/via-aerea.pdf', 1, '["Cricotireoidostomia", "IOT", "Videolaringoscopia"]'),
  (22, 8, 'Reanimação Volêmica', 'reanimacao-volemica', 'Cristaloides vs coloides no trauma.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 45, '/static/pdfs/reanimacao.pdf', 2, '["Ringer lactato", "Protocolo de transfusão maciça"]'),
  (23, 8, 'FAST Protocol', 'fast-protocol', 'Ultrassom no trauma.', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 38, '/static/pdfs/fast.pdf', 3, '["Janelas do FAST", "eFAST", "Hemoperitônio"]');

-- Insert user progress
INSERT OR IGNORE INTO user_track_progress (user_id, track_id, completed_lessons, total_lessons, progress_percentage, last_lesson_id) VALUES 
  (2, 1, 3, 10, 30.0, 3),
  (2, 6, 2, 15, 13.3, 17);

INSERT OR IGNORE INTO user_lesson_progress (user_id, lesson_id, is_completed, watch_time_seconds) VALUES 
  (2, 1, 1, 2700),
  (2, 2, 1, 3000),
  (2, 3, 1, 2400),
  (2, 16, 1, 3600),
  (2, 17, 0, 1800);

INSERT OR IGNORE INTO user_favorites (user_id, lesson_id) VALUES 
  (2, 1),
  (2, 9),
  (2, 16);
