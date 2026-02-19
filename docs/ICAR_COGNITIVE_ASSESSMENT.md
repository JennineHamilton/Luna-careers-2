# ICAR Cognitive Assessment Implementation

## Overview
Luna Careers uses the **International Cognitive Ability Resource (ICAR)** public domain test items for cognitive assessment. ICAR is a validated, research-backed cognitive ability test developed by Condon & Revelle (2014).

## ICAR Background

### What is ICAR?
- **Public domain** cognitive ability test items
- Validated against traditional IQ tests (Wonderlic, Raven's Progressive Matrices)
- Used in academic research worldwide
- Free for non-commercial and research use

### ICAR Item Types (60 total items)
1. **Letter/Number Series** (9 items) - Pattern recognition in sequences
2. **Matrix Reasoning** (11 items) - Raven's-style visual pattern completion
3. **Verbal Reasoning** (16 items) - Logic, vocabulary, comprehension
4. **Three-Dimensional Rotation** (24 items) - Spatial reasoning

### ICAR Sample Test
The **16-item ICAR Sample Test** is publicly available and includes:
- 4 Letter/Number Series
- 4 Matrix Reasoning
- 4 Verbal Reasoning
- 4 Three-Dimensional Rotation

## Luna Careers Implementation

### Our 4 Cognitive Domains (40 questions + 8 practice)

We've adapted ICAR items into 4 domains aligned with job-relevant skills:

#### 1. Verbal Reasoning (10 questions + 2 practice)
- **ICAR Source**: Verbal Reasoning items
- **Suggested Time**: 45 seconds per question
- **Skills Tested**: Reading comprehension, vocabulary, logical inference, analogies
- **Example**: "IF the day after tomorrow is two days before Thursday, what day is today?"

#### 2. Numerical Reasoning (10 questions + 2 practice)
- **ICAR Source**: Letter/Number Series items
- **Suggested Time**: 60 seconds per question
- **Skills Tested**: Number patterns, sequences, basic math, data interpretation
- **Example**: "What number comes next? 2, 4, 8, 16, ___"

#### 3. Abstract/Pattern Recognition (10 questions + 2 practice)
- **ICAR Source**: Matrix Reasoning items
- **Suggested Time**: 90 seconds per question
- **Skills Tested**: Visual pattern recognition, spatial reasoning, abstract thinking
- **Format**: Raven's-style 3x3 matrices with missing piece
- **Visual Assets**: Downloaded from ICAR and hosted in Supabase Storage

#### 4. Attention to Detail (10 questions + 2 practice)
- **ICAR Source**: Three-Dimensional Rotation items (adapted)
- **Suggested Time**: 30 seconds per question
- **Skills Tested**: Error detection, instruction following, visual comparison
- **Format**: Spot differences, identify errors, follow complex instructions

## Accessing ICAR Items

### Official ICAR Website
- **URL**: https://icar-project.com
- **Registration**: Required (approval usually within 3 days)
- **Access**: Academic and research use (commercial use requires permission)

### What You Get
1. **ICAR Catalogue PDF** - Full item descriptions and sample questions
2. **Item Images** - High-resolution images for matrix reasoning and 3D rotation
3. **Normative Data** - Percentile tables from large samples (N > 5,000)
4. **Validation Studies** - Research papers on reliability and validity

### Registration Process
1. Go to https://icar-project.com
2. Click "Register" or "Request Access"
3. Fill out application form (name, institution, intended use)
4. Wait for approval email (usually < 3 days)
5. Download items and normative data

## Normative Data (ICAR Norms)

### Source
- **Citation**: Condon, D. M., & Revelle, W. (2014). The International Cognitive Ability Resource: Development and initial validation of a public-domain measure. *Intelligence*, 43, 52-64.
- **Sample Size**: N > 5,000 adults
- **Population**: U.S. online sample (representative of general population)

### Percentile Conversion
Raw scores (percentage correct) are converted to percentiles using ICAR published norms:

| Raw Score (%) | Percentile | Interpretation |
|---------------|------------|----------------|
| 0-20          | 1-10       | Below Average  |
| 21-40         | 11-30      | Low Average    |
| 41-60         | 31-70      | Average        |
| 61-80         | 71-90      | Above Average  |
| 81-100        | 91-99      | Superior       |

## Scoring Algorithm

### Raw Scores (per domain)
```typescript
const verbalScore = (correctAnswers / 10) * 100; // 0-100 scale
```

### Overall Score (weighted average)
```typescript
const overallScore = (
  verbalScore * 0.25 +
  numericalScore * 0.25 +
  abstractScore * 0.30 + // weighted higher (best predictor of g)
  attentionScore * 0.20
);
```

### Speed Adjustment
Fast accurate responses receive a bonus:
```typescript
if (is_correct && time_taken < suggested_time) {
  adjusted_score = raw_score * 1.1; // 10% bonus
}
```

### Percentile Lookup
Convert raw scores to percentiles using `cognitive_norms` table (ICAR data).

## Visual Assets

### Storage Location
- **Supabase Storage Bucket**: `cognitive-assets`
- **Paths**:
  - `/matrix-reasoning/` - Matrix reasoning images
  - `/3d-rotation/` - Three-dimensional rotation images

### Image Format
- **Format**: PNG or JPEG
- **Resolution**: 800x800px minimum
- **Naming**: `{icar_item_id}.png` (e.g., `ICAR-MR-01.png`)

## Next Steps

### Immediate Actions Required
1. **Register for ICAR Access** at https://icar-project.com
2. **Download ICAR Items** once approved
3. **Download Visual Assets** (matrix reasoning, 3D rotation images)
4. **Upload to Supabase Storage** at `/cognitive-assets/`
5. **Create Seed Scripts** with actual ICAR items

### Placeholder Implementation
Until ICAR access is obtained, we can:
1. Use sample items from published research papers
2. Create ICAR-style questions based on published examples
3. Implement the full assessment flow with placeholder data
4. Replace with actual ICAR items once access is granted

## References

1. Condon, D. M., & Revelle, W. (2014). The International Cognitive Ability Resource: Development and initial validation of a public-domain measure. *Intelligence*, 43, 52-64.
2. ICAR Project Website: https://icar-project.com
3. ICAR Catalogue PDF: https://icar-project.com/ICAR_Catalogue.pdf

