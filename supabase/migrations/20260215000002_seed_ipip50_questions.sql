-- =====================================================
-- Seed IPIP-50 Validated Questions
-- Source: Goldberg, L. R. (1992). The development of markers 
-- for the Big-Five factor structure. Psychological Assessment, 4, 26-42.
-- Official IPIP website: https://ipip.ori.org/new_ipip-50-item-scale.htm
-- =====================================================

-- Insert all 50 validated IPIP questions
-- Format: (question_number, question_text, dimension, is_reversed)

INSERT INTO personality_questions (question_number, question_text, dimension, is_reversed) VALUES
-- EXTRAVERSION (Factor 1) - 10 items
(1, 'Am the life of the party.', 'extraversion', false),
(6, 'Don''t talk a lot.', 'extraversion', true),
(11, 'Feel comfortable around people.', 'extraversion', false),
(16, 'Keep in the background.', 'extraversion', true),
(21, 'Start conversations.', 'extraversion', false),
(26, 'Have little to say.', 'extraversion', true),
(31, 'Talk to a lot of different people at parties.', 'extraversion', false),
(36, 'Don''t like to draw attention to myself.', 'extraversion', true),
(41, 'Don''t mind being the center of attention.', 'extraversion', false),
(46, 'Am quiet around strangers.', 'extraversion', true),

-- AGREEABLENESS (Factor 2) - 10 items
(2, 'Feel little concern for others.', 'agreeableness', true),
(7, 'Am interested in people.', 'agreeableness', false),
(12, 'Insult people.', 'agreeableness', true),
(17, 'Sympathize with others'' feelings.', 'agreeableness', false),
(22, 'Am not interested in other people''s problems.', 'agreeableness', true),
(27, 'Have a soft heart.', 'agreeableness', false),
(32, 'Am not really interested in others.', 'agreeableness', true),
(37, 'Take time out for others.', 'agreeableness', false),
(42, 'Feel others'' emotions.', 'agreeableness', false),
(47, 'Make people feel at ease.', 'agreeableness', false),

-- CONSCIENTIOUSNESS (Factor 3) - 10 items
(3, 'Am always prepared.', 'conscientiousness', false),
(8, 'Leave my belongings around.', 'conscientiousness', true),
(13, 'Pay attention to details.', 'conscientiousness', false),
(18, 'Make a mess of things.', 'conscientiousness', true),
(23, 'Get chores done right away.', 'conscientiousness', false),
(28, 'Often forget to put things back in their proper place.', 'conscientiousness', true),
(33, 'Like order.', 'conscientiousness', false),
(38, 'Shirk my duties.', 'conscientiousness', true),
(43, 'Follow a schedule.', 'conscientiousness', false),
(48, 'Am exacting in my work.', 'conscientiousness', false),

-- EMOTIONAL STABILITY (Factor 4) - 10 items
-- Note: This measures emotional stability (inverse of neuroticism)
(4, 'Get stressed out easily.', 'emotional_stability', true),
(9, 'Am relaxed most of the time.', 'emotional_stability', false),
(14, 'Worry about things.', 'emotional_stability', true),
(19, 'Seldom feel blue.', 'emotional_stability', false),
(24, 'Am easily disturbed.', 'emotional_stability', true),
(29, 'Get upset easily.', 'emotional_stability', true),
(34, 'Change my mood a lot.', 'emotional_stability', true),
(39, 'Have frequent mood swings.', 'emotional_stability', true),
(44, 'Get irritated easily.', 'emotional_stability', true),
(49, 'Often feel blue.', 'emotional_stability', true),

-- INTELLECT/IMAGINATION (Factor 5) - 10 items
-- Note: This measures Openness to Experience
(5, 'Have a rich vocabulary.', 'intellect', false),
(10, 'Have difficulty understanding abstract ideas.', 'intellect', true),
(15, 'Have a vivid imagination.', 'intellect', false),
(20, 'Am not interested in abstract ideas.', 'intellect', true),
(25, 'Have excellent ideas.', 'intellect', false),
(30, 'Do not have a good imagination.', 'intellect', true),
(35, 'Am quick to understand things.', 'intellect', false),
(40, 'Use difficult words.', 'intellect', false),
(45, 'Spend time reflecting on things.', 'intellect', false),
(50, 'Am full of ideas.', 'intellect', false)
ON CONFLICT (question_number) DO NOTHING;

-- Verify all 50 questions were inserted
DO $$
DECLARE
  question_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO question_count FROM personality_questions;
  
  IF question_count != 50 THEN
    RAISE EXCEPTION 'Expected 50 questions, but found %', question_count;
  END IF;
  
  RAISE NOTICE 'Successfully seeded % IPIP-50 validated questions', question_count;
END $$;

