-- =====================================================
-- Comprehensive Skills Seed Data
-- =====================================================
-- Industry-standard skills with motivational descriptions
-- Categories: technical, soft_skill, industry_specific, 
--             business, creative, data_analytics, 
--             leadership, communication, digital_literacy
-- =====================================================

-- Clear existing skills (for development/testing)
-- TRUNCATE TABLE skills CASCADE;

-- =====================================================
-- TECHNICAL SKILLS
-- =====================================================

INSERT INTO skills (name, category, description) VALUES
-- Programming Languages
('JavaScript', 'technical', 'Power modern web applications with the world''s most popular programming language'),
('Python', 'technical', 'Automate tasks and build AI solutions with this versatile, beginner-friendly language'),
('Java', 'technical', 'Build enterprise-grade applications trusted by Fortune 500 companies'),
('TypeScript', 'technical', 'Write safer, more maintainable code with JavaScript''s powerful typed superset'),
('C#', 'technical', 'Create robust applications for Windows, games, and enterprise systems'),
('SQL', 'technical', 'Unlock insights from data by mastering the language of databases'),
('HTML/CSS', 'technical', 'Bring designs to life and create beautiful, responsive web interfaces'),
('React', 'technical', 'Build lightning-fast, interactive user interfaces used by Facebook and Netflix'),
('Node.js', 'technical', 'Create scalable server-side applications with JavaScript'),
('Angular', 'technical', 'Develop powerful single-page applications with Google''s framework'),

-- Development Tools & Practices
('Git', 'technical', 'Collaborate seamlessly and track every change in your code'),
('Docker', 'technical', 'Package applications perfectly and deploy anywhere with confidence'),
('Kubernetes', 'technical', 'Orchestrate containers at scale like tech giants do'),
('CI/CD', 'technical', 'Automate deployments and ship features faster with continuous integration'),
('REST API', 'technical', 'Connect systems and build integrations that power modern applications'),
('GraphQL', 'technical', 'Query data efficiently and build flexible, modern APIs'),
('AWS', 'technical', 'Harness the power of cloud computing with Amazon''s industry-leading platform'),
('Azure', 'technical', 'Build and scale applications on Microsoft''s enterprise cloud'),
('Agile/Scrum', 'technical', 'Deliver value faster with the methodology used by top tech teams'),
('Test-Driven Development', 'technical', 'Write bulletproof code with confidence through automated testing'),

-- Cybersecurity
('Cybersecurity Fundamentals', 'technical', 'Protect systems and data from evolving digital threats'),
('Penetration Testing', 'technical', 'Think like a hacker to find vulnerabilities before attackers do'),
('Network Security', 'technical', 'Safeguard digital infrastructure and prevent unauthorized access'),

-- SOFT SKILLS

('Critical Thinking', 'soft_skill', 'Analyze complex problems and make sound decisions that drive results'),
('Problem Solving', 'soft_skill', 'Turn challenges into opportunities with creative, effective solutions'),
('Teamwork', 'soft_skill', 'Collaborate effectively and achieve more together than alone'),
('Adaptability', 'soft_skill', 'Thrive in change and turn uncertainty into opportunity'),
('Time Management', 'soft_skill', 'Master your schedule and accomplish more with less stress'),
('Emotional Intelligence', 'soft_skill', 'Build stronger relationships by understanding yourself and others'),
('Conflict Resolution', 'soft_skill', 'Transform disagreements into productive conversations and solutions'),
('Active Listening', 'soft_skill', 'Truly hear others and build trust through genuine understanding'),
('Creativity', 'soft_skill', 'Generate innovative ideas that solve problems in unexpected ways'),
('Attention to Detail', 'soft_skill', 'Catch what others miss and deliver flawless work every time'),
('Work Ethic', 'soft_skill', 'Demonstrate reliability and commitment that employers value'),
('Resilience', 'soft_skill', 'Bounce back from setbacks stronger and more determined'),
('Cultural Awareness', 'soft_skill', 'Navigate diverse environments with respect and understanding'),
('Negotiation', 'soft_skill', 'Reach win-win agreements and advocate effectively for your interests'),

-- BUSINESS SKILLS

('Project Management', 'business', 'Deliver projects on time and budget while exceeding expectations'),
('Strategic Planning', 'business', 'Chart the course for long-term success with clear, actionable strategies'),
('Financial Analysis', 'business', 'Make data-driven decisions by understanding the numbers that matter'),
('Business Development', 'business', 'Identify opportunities and drive sustainable growth'),
('Risk Management', 'business', 'Anticipate challenges and protect your organization from threats'),
('Process Improvement', 'business', 'Streamline operations and eliminate waste for maximum efficiency'),
('Budgeting', 'business', 'Allocate resources wisely and maximize return on investment'),
('Stakeholder Management', 'business', 'Build alignment and support across diverse groups'),
('Change Management', 'business', 'Guide organizations through transformation with minimal disruption'),
('Entrepreneurship', 'business', 'Turn ideas into thriving businesses with innovation and determination'),

-- DATA & ANALYTICS SKILLS

('Data Analysis', 'data_analytics', 'Transform raw data into actionable insights that drive decisions'),
('Excel Advanced', 'data_analytics', 'Master formulas, pivot tables, and macros to become a spreadsheet wizard'),
('Tableau', 'data_analytics', 'Create stunning visualizations that tell compelling data stories'),
('Power BI', 'data_analytics', 'Build interactive dashboards that bring data to life'),
('Statistical Analysis', 'data_analytics', 'Uncover patterns and trends hidden in complex datasets'),
('Machine Learning', 'data_analytics', 'Build intelligent systems that learn and improve over time'),
('Data Visualization', 'data_analytics', 'Communicate insights clearly through powerful visual storytelling'),
('Big Data', 'data_analytics', 'Handle massive datasets and extract value at scale'),
('Predictive Analytics', 'data_analytics', 'Forecast trends and make proactive, informed decisions'),
('A/B Testing', 'data_analytics', 'Optimize performance through scientific experimentation'),

-- LEADERSHIP SKILLS

('Team Leadership', 'leadership', 'Inspire and guide teams to achieve extraordinary results'),
('Mentoring', 'leadership', 'Develop others and multiply your impact through their growth'),
('Decision Making', 'leadership', 'Make confident choices even with incomplete information'),
('Delegation', 'leadership', 'Empower others and focus your energy where it matters most'),
('Performance Management', 'leadership', 'Bring out the best in people through feedback and development'),
('Vision Setting', 'leadership', 'Paint a compelling picture of the future that motivates action'),
('Coaching', 'leadership', 'Unlock potential by asking the right questions and providing guidance'),
('Talent Development', 'leadership', 'Build high-performing teams by investing in people'),
('Strategic Leadership', 'leadership', 'Align teams with organizational goals and drive execution'),

-- COMMUNICATION SKILLS

('Public Speaking', 'communication', 'Command attention and inspire audiences with confident presentations'),
('Business Writing', 'communication', 'Craft clear, persuasive messages that get results'),
('Technical Writing', 'communication', 'Explain complex concepts simply and accurately'),
('Presentation Skills', 'communication', 'Deliver compelling presentations that engage and persuade'),
('Interpersonal Communication', 'communication', 'Build rapport and connect authentically with anyone'),
('Cross-Cultural Communication', 'communication', 'Bridge cultural differences and communicate effectively globally'),
('Storytelling', 'communication', 'Captivate audiences and make messages memorable through narrative'),
('Email Etiquette', 'communication', 'Communicate professionally and effectively in digital correspondence'),
('Meeting Facilitation', 'communication', 'Lead productive meetings that respect time and drive outcomes'),

-- CREATIVE SKILLS

('Graphic Design', 'creative', 'Create visual content that captures attention and communicates ideas'),
('UI/UX Design', 'creative', 'Design intuitive, delightful experiences that users love'),
('Content Creation', 'creative', 'Produce engaging content that resonates with your audience'),
('Video Editing', 'creative', 'Craft compelling video stories that engage and inspire'),
('Copywriting', 'creative', 'Write persuasive copy that converts readers into customers'),
('Brand Strategy', 'creative', 'Build memorable brands that stand out in crowded markets'),
('Photography', 'creative', 'Capture moments and tell stories through powerful imagery'),
('Adobe Creative Suite', 'creative', 'Master industry-standard tools for professional creative work'),
('Social Media Content', 'creative', 'Create scroll-stopping content that drives engagement'),
('Design Thinking', 'creative', 'Solve problems creatively with human-centered innovation'),

-- DIGITAL LITERACY SKILLS

('Microsoft Office', 'digital_literacy', 'Navigate essential productivity tools with confidence'),
('Google Workspace', 'digital_literacy', 'Collaborate seamlessly with cloud-based productivity tools'),
('Digital Marketing', 'digital_literacy', 'Reach and engage customers in the digital age'),
('SEO', 'digital_literacy', 'Get found online by mastering search engine optimization'),
('Social Media Management', 'digital_literacy', 'Build and engage communities across social platforms'),
('Email Marketing', 'digital_literacy', 'Nurture relationships and drive conversions through email'),
('CRM Software', 'digital_literacy', 'Manage customer relationships and drive sales with technology'),
('Basic Coding', 'digital_literacy', 'Understand how technology works and communicate with developers'),
('Cloud Computing', 'digital_literacy', 'Leverage cloud services to work smarter and more flexibly'),
('Cybersecurity Awareness', 'digital_literacy', 'Protect yourself and your organization from digital threats'),

-- INDUSTRY-SPECIFIC SKILLS

-- Healthcare
('Healthcare Compliance', 'industry_specific', 'Navigate regulations and ensure patient safety in healthcare settings'),
('Medical Terminology', 'industry_specific', 'Communicate effectively in healthcare with professional vocabulary'),
('Patient Care', 'industry_specific', 'Provide compassionate, quality care that improves patient outcomes'),
('Electronic Health Records', 'industry_specific', 'Manage patient information efficiently with modern healthcare systems'),
('HIPAA Compliance', 'industry_specific', 'Protect patient privacy and meet healthcare regulatory requirements'),

-- Finance & Accounting
('Financial Modeling', 'industry_specific', 'Build sophisticated models that guide strategic financial decisions'),
('GAAP', 'industry_specific', 'Apply accounting principles that ensure financial accuracy and compliance'),
('Tax Preparation', 'industry_specific', 'Navigate tax codes and maximize returns for individuals and businesses'),
('Auditing', 'industry_specific', 'Ensure financial integrity through systematic examination and verification'),
('Investment Analysis', 'industry_specific', 'Evaluate opportunities and make informed investment recommendations'),

-- Legal
('Legal Research', 'industry_specific', 'Find relevant precedents and build strong legal arguments'),
('Contract Law', 'industry_specific', 'Draft and review agreements that protect interests and minimize risk'),
('Compliance', 'industry_specific', 'Ensure organizational adherence to laws and regulations'),
('Litigation', 'industry_specific', 'Advocate effectively in legal disputes and courtroom proceedings'),

-- Education
('Curriculum Development', 'industry_specific', 'Design engaging learning experiences that achieve educational goals'),
('Classroom Management', 'industry_specific', 'Create positive learning environments where students thrive'),
('Educational Technology', 'industry_specific', 'Enhance learning with digital tools and innovative approaches'),
('Assessment Design', 'industry_specific', 'Measure learning effectively and provide meaningful feedback'),

-- Manufacturing & Engineering
('Lean Manufacturing', 'industry_specific', 'Eliminate waste and maximize efficiency in production processes'),
('Quality Control', 'industry_specific', 'Ensure products meet standards and exceed customer expectations'),
('CAD Software', 'industry_specific', 'Design and prototype products with computer-aided design tools'),
('Supply Chain Management', 'industry_specific', 'Optimize the flow of goods from supplier to customer'),
('Six Sigma', 'industry_specific', 'Drive quality improvement through data-driven methodologies'),

-- Sales & Marketing
('Sales Strategy', 'industry_specific', 'Develop approaches that consistently close deals and grow revenue'),
('Customer Relationship Management', 'industry_specific', 'Build lasting relationships that drive loyalty and repeat business'),
('Market Research', 'industry_specific', 'Understand customer needs and identify market opportunities'),
('Brand Management', 'industry_specific', 'Build and protect brand value in competitive markets'),
('Lead Generation', 'industry_specific', 'Attract and qualify prospects to fuel the sales pipeline'),

-- Hospitality & Tourism
('Customer Service Excellence', 'industry_specific', 'Deliver exceptional experiences that create loyal customers'),
('Event Planning', 'industry_specific', 'Orchestrate memorable events that exceed expectations'),
('Food Safety', 'industry_specific', 'Ensure safe food handling and meet health regulations'),
('Hotel Management', 'industry_specific', 'Operate hospitality businesses that delight guests and drive profit'),

-- Real Estate
('Property Management', 'industry_specific', 'Maintain properties and maximize value for owners'),
('Real Estate Law', 'industry_specific', 'Navigate legal requirements in property transactions'),
('Property Valuation', 'industry_specific', 'Assess property worth accurately for informed decisions'),
('Lease Negotiation', 'industry_specific', 'Secure favorable terms in rental agreements'),

-- Human Resources
('Recruitment', 'industry_specific', 'Find and attract top talent that drives organizational success'),
('Employee Relations', 'industry_specific', 'Foster positive workplace culture and resolve conflicts'),
('Compensation & Benefits', 'industry_specific', 'Design packages that attract and retain great people'),
('HR Analytics', 'industry_specific', 'Use data to optimize workforce planning and performance'),
('Onboarding', 'industry_specific', 'Welcome new hires and set them up for long-term success'),

-- Retail
('Merchandising', 'industry_specific', 'Present products in ways that drive sales and delight customers'),
('Inventory Management', 'industry_specific', 'Balance stock levels to meet demand without excess'),
('Point of Sale Systems', 'industry_specific', 'Process transactions efficiently with modern retail technology'),
('Visual Merchandising', 'industry_specific', 'Create displays that attract attention and inspire purchases'),

-- Construction
('Blueprint Reading', 'industry_specific', 'Interpret technical drawings to build accurately'),
('Construction Safety', 'industry_specific', 'Prevent accidents and create safe work environments'),
('Project Estimation', 'industry_specific', 'Calculate costs accurately for profitable project bids'),
('Building Codes', 'industry_specific', 'Ensure construction meets regulatory standards');

-- Add updated_at trigger for skills table if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Only create trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_skills_updated_at'
    ) THEN
        CREATE TRIGGER update_skills_updated_at
            BEFORE UPDATE ON skills
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

