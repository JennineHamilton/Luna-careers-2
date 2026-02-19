-- =====================================================
-- COGNITIVE QUESTIONS SEED (ICAR-STYLE PLACEHOLDER ITEMS)
-- =====================================================
-- NOTE: These are PLACEHOLDER questions in ICAR style.
-- Replace with actual ICAR items once access is obtained from https://icar-project.com
-- Source: Based on ICAR Catalogue samples and published research
-- =====================================================

-- Reference to the cognitive template
DO $$
DECLARE
  template_uuid UUID := '00000000-0000-0000-0000-000000000001'::uuid;
BEGIN

-- =====================================================
-- VERBAL REASONING DOMAIN (12 questions: 2 practice + 10 real)
-- =====================================================

-- PRACTICE QUESTIONS (with explanations)
INSERT INTO cognitive_questions (template_id, domain, question_type, question_text, options, correct_answer, suggested_time_seconds, difficulty_level, icar_item_id, is_practice, display_order, explanation) VALUES
(template_uuid, 'verbal', 'multiple_choice_text', 
 'Happy is to sad as up is to ___',
 '["Down", "Sideways", "Happy", "Tall"]'::jsonb,
 'Down',
 45, 'easy', 'PRACTICE-VR-01', true, 1,
 'This is an analogy question. Happy and sad are opposites, so up and down are also opposites.'),

(template_uuid, 'verbal', 'multiple_choice_text',
 'Which word does NOT belong with the others?',
 '["Apple", "Banana", "Carrot", "Orange"]'::jsonb,
 'Carrot',
 45, 'easy', 'PRACTICE-VR-02', true, 2,
 'Apple, banana, and orange are all fruits. Carrot is a vegetable, so it does not belong.');

-- REAL QUESTIONS (no explanations, ordered easy → medium → hard)
INSERT INTO cognitive_questions (template_id, domain, question_type, question_text, options, correct_answer, suggested_time_seconds, difficulty_level, icar_item_id, is_practice, display_order) VALUES
-- Easy (3 questions)
(template_uuid, 'verbal', 'multiple_choice_text',
 'IF the day after tomorrow is two days before Thursday, what day is today?',
 '["Sunday", "Monday", "Tuesday", "Wednesday"]'::jsonb,
 'Tuesday',
 45, 'easy', 'ICAR-VR-01', false, 3),

(template_uuid, 'verbal', 'multiple_choice_text',
 'Book is to reading as fork is to ___',
 '["Drawing", "Writing", "Stirring", "Eating"]'::jsonb,
 'Eating',
 45, 'easy', 'ICAR-VR-02', false, 4),

(template_uuid, 'verbal', 'multiple_choice_text',
 'Which word is most similar in meaning to "brief"?',
 '["Short", "Long", "Wide", "Tall"]'::jsonb,
 'Short',
 45, 'easy', 'ICAR-VR-03', false, 5),

-- Medium (4 questions)
(template_uuid, 'verbal', 'multiple_choice_text',
 'All roses are flowers. Some flowers fade quickly. Therefore:',
 '["All roses fade quickly", "Some roses may fade quickly", "No roses fade quickly", "All flowers are roses"]'::jsonb,
 'Some roses may fade quickly',
 45, 'medium', 'ICAR-VR-04', false, 6),

(template_uuid, 'verbal', 'multiple_choice_text',
 'Which word is the opposite of "abundant"?',
 '["Plentiful", "Scarce", "Numerous", "Ample"]'::jsonb,
 'Scarce',
 45, 'medium', 'ICAR-VR-05', false, 7),

(template_uuid, 'verbal', 'multiple_choice_text',
 'Pen is to poet as needle is to ___',
 '["Thread", "Tailor", "Cloth", "Button"]'::jsonb,
 'Tailor',
 45, 'medium', 'ICAR-VR-06', false, 8),

(template_uuid, 'verbal', 'multiple_choice_text',
 'Which word best completes the analogy? Calm is to agitated as enlightened is to ___',
 '["Aware", "Ignorant", "Bright", "Educated"]'::jsonb,
 'Ignorant',
 45, 'medium', 'ICAR-VR-07', false, 9),

-- Hard (3 questions)
(template_uuid, 'verbal', 'multiple_choice_text',
 'If some Bloops are Razzies and all Razzies are Lazzies, then some Bloops are definitely Lazzies.',
 '["True", "False", "Cannot be determined"]'::jsonb,
 'True',
 45, 'hard', 'ICAR-VR-08', false, 10),

(template_uuid, 'verbal', 'multiple_choice_text',
 'Which word is most nearly opposite in meaning to "ephemeral"?',
 '["Eternal", "Temporary", "Brief", "Fleeting"]'::jsonb,
 'Eternal',
 45, 'hard', 'ICAR-VR-09', false, 11),

(template_uuid, 'verbal', 'multiple_choice_text',
 'Mendacious is to truthful as parsimonious is to ___',
 '["Generous", "Stingy", "Careful", "Wealthy"]'::jsonb,
 'Generous',
 45, 'hard', 'ICAR-VR-10', false, 12);

-- =====================================================
-- NUMERICAL REASONING DOMAIN (12 questions: 2 practice + 10 real)
-- =====================================================

-- PRACTICE QUESTIONS
INSERT INTO cognitive_questions (template_id, domain, question_type, question_text, options, correct_answer, suggested_time_seconds, difficulty_level, icar_item_id, is_practice, display_order, explanation) VALUES
(template_uuid, 'numerical', 'number_sequence',
 'What number comes next in the sequence? 2, 4, 6, 8, ___',
 '["9", "10", "12", "14"]'::jsonb,
 '10',
 60, 'easy', 'PRACTICE-NR-01', true, 13,
 'This sequence increases by 2 each time: 2+2=4, 4+2=6, 6+2=8, 8+2=10.'),

(template_uuid, 'numerical', 'number_sequence',
 'What number comes next? 1, 4, 9, 16, ___',
 '["20", "25", "30", "36"]'::jsonb,
 '25',
 60, 'easy', 'PRACTICE-NR-02', true, 14,
 'These are perfect squares: 1²=1, 2²=4, 3²=9, 4²=16, 5²=25.');

-- REAL QUESTIONS (ordered easy → medium → hard)
INSERT INTO cognitive_questions (template_id, domain, question_type, question_text, options, correct_answer, suggested_time_seconds, difficulty_level, icar_item_id, is_practice, display_order) VALUES
-- Easy (3 questions)
(template_uuid, 'numerical', 'number_sequence',
 'What number comes next? 3, 6, 9, 12, ___',
 '["13", "14", "15", "16"]'::jsonb,
 '15',
 60, 'easy', 'ICAR-NR-01', false, 15),

(template_uuid, 'numerical', 'number_sequence',
 'What number comes next? 5, 10, 15, 20, ___',
 '["22", "24", "25", "30"]'::jsonb,
 '25',
 60, 'easy', 'ICAR-NR-02', false, 16),

(template_uuid, 'numerical', 'number_sequence',
 'What number comes next? 100, 90, 80, 70, ___',
 '["65", "60", "55", "50"]'::jsonb,
 '60',
 60, 'easy', 'ICAR-NR-03', false, 17),

-- Medium (4 questions)
(template_uuid, 'numerical', 'number_sequence',
 'What number comes next? 2, 4, 8, 16, ___',
 '["24", "28", "32", "36"]'::jsonb,
 '32',
 60, 'medium', 'ICAR-NR-04', false, 18),

(template_uuid, 'numerical', 'number_sequence',
 'What number comes next? 1, 1, 2, 3, 5, 8, ___',
 '["11", "12", "13", "14"]'::jsonb,
 '13',
 60, 'medium', 'ICAR-NR-05', false, 19),

(template_uuid, 'numerical', 'multiple_choice_text',
 'If 5 workers can complete a task in 12 days, how many days will it take 3 workers to complete the same task?',
 '["7.2 days", "15 days", "20 days", "36 days"]'::jsonb,
 '20 days',
 60, 'medium', 'ICAR-NR-06', false, 20),

(template_uuid, 'numerical', 'number_sequence',
 'What number comes next? 3, 9, 27, 81, ___',
 '["162", "216", "243", "324"]'::jsonb,
 '243',
 60, 'medium', 'ICAR-NR-07', false, 21),

-- Hard (3 questions)
(template_uuid, 'numerical', 'number_sequence',
 'What number comes next? 2, 6, 12, 20, 30, ___',
 '["40", "42", "44", "48"]'::jsonb,
 '42',
 60, 'hard', 'ICAR-NR-08', false, 22),

(template_uuid, 'numerical', 'multiple_choice_text',
 'A car travels 240 miles in 4 hours. At this rate, how far will it travel in 7 hours?',
 '["360 miles", "400 miles", "420 miles", "480 miles"]'::jsonb,
 '420 miles',
 60, 'hard', 'ICAR-NR-09', false, 23),

(template_uuid, 'numerical', 'number_sequence',
 'What number comes next? 1, 4, 10, 22, 46, ___',
 '["70", "82", "94", "106"]'::jsonb,
 '94',
 60, 'hard', 'ICAR-NR-10', false, 24);

-- =====================================================
-- ABSTRACT/PATTERN RECOGNITION DOMAIN (12 questions: 2 practice + 10 real)
-- =====================================================
-- NOTE: These questions will use images once ICAR visual assets are obtained
-- Placeholder text descriptions provided for now

-- PRACTICE QUESTIONS
INSERT INTO cognitive_questions (template_id, domain, question_type, question_text, question_image_url, options, correct_answer, suggested_time_seconds, difficulty_level, icar_item_id, is_practice, display_order, explanation) VALUES
(template_uuid, 'abstract', 'multiple_choice_image',
 'Look at the pattern. Which shape completes the sequence? [Circle, Square, Triangle, Circle, Square, ___]',
 NULL, -- Will be replaced with actual ICAR image URL
 '["Triangle", "Circle", "Square", "Pentagon"]'::jsonb,
 'Triangle',
 90, 'easy', 'PRACTICE-AR-01', true, 25,
 'The pattern repeats: Circle, Square, Triangle. So the next shape is Triangle.'),

(template_uuid, 'abstract', 'multiple_choice_image',
 'Which shape is different from the others?',
 NULL,
 '["All shapes are the same", "Shape A", "Shape B", "Shape C"]'::jsonb,
 'Shape B',
 90, 'easy', 'PRACTICE-AR-02', true, 26,
 'Shape B is rotated differently from the others.');

-- REAL QUESTIONS (ordered easy → medium → hard)
INSERT INTO cognitive_questions (template_id, domain, question_type, question_text, question_image_url, options, correct_answer, suggested_time_seconds, difficulty_level, icar_item_id, is_practice, display_order) VALUES
-- Easy (3 questions)
(template_uuid, 'abstract', 'multiple_choice_image',
 'Complete the pattern: [3x3 matrix with missing bottom-right piece]',
 NULL, -- Placeholder for ICAR matrix reasoning image
 '["Option A", "Option B", "Option C", "Option D"]'::jsonb,
 'Option C',
 90, 'easy', 'ICAR-AR-01', false, 27),

(template_uuid, 'abstract', 'multiple_choice_image',
 'Which shape completes the sequence?',
 NULL,
 '["Option A", "Option B", "Option C", "Option D"]'::jsonb,
 'Option A',
 90, 'easy', 'ICAR-AR-02', false, 28),

(template_uuid, 'abstract', 'multiple_choice_image',
 'Find the pattern and select the missing piece.',
 NULL,
 '["Option A", "Option B", "Option C", "Option D"]'::jsonb,
 'Option D',
 90, 'easy', 'ICAR-AR-03', false, 29),

-- Medium (4 questions)
(template_uuid, 'abstract', 'multiple_choice_image',
 'Complete the matrix: [3x3 matrix with complex pattern]',
 NULL,
 '["Option A", "Option B", "Option C", "Option D"]'::jsonb,
 'Option B',
 90, 'medium', 'ICAR-AR-04', false, 30),

(template_uuid, 'abstract', 'multiple_choice_image',
 'Which piece completes the pattern?',
 NULL,
 '["Option A", "Option B", "Option C", "Option D"]'::jsonb,
 'Option C',
 90, 'medium', 'ICAR-AR-05', false, 31),

(template_uuid, 'abstract', 'multiple_choice_image',
 'Identify the missing element in the sequence.',
 NULL,
 '["Option A", "Option B", "Option C", "Option D"]'::jsonb,
 'Option A',
 90, 'medium', 'ICAR-AR-06', false, 32),

(template_uuid, 'abstract', 'multiple_choice_image',
 'Complete the pattern: [Complex 3x3 matrix]',
 NULL,
 '["Option A", "Option B", "Option C", "Option D"]'::jsonb,
 'Option D',
 90, 'medium', 'ICAR-AR-07', false, 33),

-- Hard (3 questions)
(template_uuid, 'abstract', 'multiple_choice_image',
 'Advanced matrix reasoning: [3x3 matrix with multiple overlapping patterns]',
 NULL,
 '["Option A", "Option B", "Option C", "Option D"]'::jsonb,
 'Option C',
 90, 'hard', 'ICAR-AR-08', false, 34),

(template_uuid, 'abstract', 'multiple_choice_image',
 'Complex pattern completion: [Advanced visual reasoning]',
 NULL,
 '["Option A", "Option B", "Option C", "Option D"]'::jsonb,
 'Option B',
 90, 'hard', 'ICAR-AR-09', false, 35),

(template_uuid, 'abstract', 'multiple_choice_image',
 'Expert-level matrix: [Highly complex pattern]',
 NULL,
 '["Option A", "Option B", "Option C", "Option D"]'::jsonb,
 'Option A',
 90, 'hard', 'ICAR-AR-10', false, 36);

-- =====================================================
-- ATTENTION TO DETAIL DOMAIN (12 questions: 2 practice + 10 real)
-- =====================================================

-- PRACTICE QUESTIONS
INSERT INTO cognitive_questions (template_id, domain, question_type, question_text, options, correct_answer, suggested_time_seconds, difficulty_level, icar_item_id, is_practice, display_order, explanation) VALUES
(template_uuid, 'attention', 'multiple_choice_text',
 'How many times does the letter "F" appear in this sentence? "FINISHED FILES ARE THE RESULT OF YEARS OF SCIENTIFIC STUDY COMBINED WITH THE EXPERIENCE OF YEARS"',
 '["3", "4", "5", "6"]'::jsonb,
 '6',
 30, 'easy', 'PRACTICE-AD-01', true, 37,
 'There are 6 F''s: FINISHED, FILES, oF, oF, SCIENTIFIC, oF. People often miss the F''s in "OF" because the brain reads it as "ov".'),

(template_uuid, 'attention', 'multiple_choice_text',
 'Which number is different? 8888888 8888888 8888888 8888B88 8888888',
 '["First group", "Second group", "Third group", "Fourth group"]'::jsonb,
 'Fourth group',
 30, 'easy', 'PRACTICE-AD-02', true, 38,
 'The fourth group has a "B" instead of an "8".');

-- REAL QUESTIONS (ordered easy → medium → hard)
INSERT INTO cognitive_questions (template_id, domain, question_type, question_text, options, correct_answer, suggested_time_seconds, difficulty_level, icar_item_id, is_practice, display_order) VALUES
-- Easy (3 questions)
(template_uuid, 'attention', 'multiple_choice_text',
 'Count the number of 7s: 7177717771777177717',
 '["8", "9", "10", "11"]'::jsonb,
 '10',
 30, 'easy', 'ICAR-AD-01', false, 39),

(template_uuid, 'attention', 'multiple_choice_text',
 'Which word is spelled incorrectly? "The committee will meet tomorrow to discuss the budget."',
 '["committee", "tomorrow", "discuss", "All correct"]'::jsonb,
 'All correct',
 30, 'easy', 'ICAR-AD-02', false, 40),

(template_uuid, 'attention', 'multiple_choice_text',
 'Find the odd one out: AAAA AAAA AAAA AABA AAAA',
 '["First", "Second", "Third", "Fourth"]'::jsonb,
 'Fourth',
 30, 'easy', 'ICAR-AD-03', false, 41),

-- Medium (4 questions)
(template_uuid, 'attention', 'multiple_choice_text',
 'How many times does "the" appear? "The theory of the universe suggests that the beginning of the cosmos was the result of the big bang."',
 '["4", "5", "6", "7"]'::jsonb,
 '6',
 30, 'medium', 'ICAR-AD-04', false, 42),

(template_uuid, 'attention', 'multiple_choice_text',
 'Which sequence is different? A) 123456789 B) 123456789 C) 123456789 D) 123456788',
 '["A", "B", "C", "D"]'::jsonb,
 'D',
 30, 'medium', 'ICAR-AD-05', false, 43),

(template_uuid, 'attention', 'multiple_choice_text',
 'Count the vowels (a,e,i,o,u) in: "ATTENTION TO DETAIL IS CRUCIAL"',
 '["9", "10", "11", "12"]'::jsonb,
 '11',
 30, 'medium', 'ICAR-AD-06', false, 44),

(template_uuid, 'attention', 'multiple_choice_text',
 'Which word contains an error? "The manager recieved the report and forwarded it immediately."',
 '["manager", "recieved", "forwarded", "immediately"]'::jsonb,
 'recieved',
 30, 'medium', 'ICAR-AD-07', false, 45),

-- Hard (3 questions)
(template_uuid, 'attention', 'multiple_choice_text',
 'How many differences are there between these two strings? "ABCDEFGHIJKLMNOP" vs "ABCDEFGHIJXLMNOP"',
 '["0", "1", "2", "3"]'::jsonb,
 '1',
 30, 'hard', 'ICAR-AD-08', false, 46),

(template_uuid, 'attention', 'multiple_choice_text',
 'Count the number of times the digit "3" appears: 3133313333133313331333313',
 '["12", "13", "14", "15"]'::jsonb,
 '14',
 30, 'hard', 'ICAR-AD-09', false, 47),

(template_uuid, 'attention', 'multiple_choice_text',
 'Which statement contains a factual error? A) "There are 7 days in a week" B) "February has 28 or 29 days" C) "A decade is 100 years" D) "An hour has 60 minutes"',
 '["A", "B", "C", "D"]'::jsonb,
 'C',
 30, 'hard', 'ICAR-AD-10', false, 48);

END $$;

