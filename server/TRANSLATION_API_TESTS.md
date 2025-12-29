# Translation API - Postman Test Data

## 1. First, Run the Migration
Execute this SQL in your database:
```sql
CREATE TABLE IF NOT EXISTS correct_translations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    original_word VARCHAR(255) NOT NULL,
    wrong_translation VARCHAR(255) NOT NULL,
    correct_translation VARCHAR(255) NOT NULL,
    language_code VARCHAR(10) NOT NULL COMMENT 'e.g., fa for Persian, ar for Arabic',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_translation (original_word, wrong_translation, language_code),
    INDEX idx_language (language_code),
    INDEX idx_original (original_word)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 2. Store Correct Translation (POST)

**Endpoint:** `POST http://localhost:3000/api/v1/translations`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**

### Example 1: Persian Translation
```json
{
    "original_word": "Football",
    "wrong_translation": "فوتبال نادرست",
    "correct_translation": "فوتبال",
    "language_code": "fa"
}
```

### Example 2: Arabic Translation
```json
{
    "original_word": "Match",
    "wrong_translation": "مباراة خاطئة",
    "correct_translation": "مباراة",
    "language_code": "ar"
}
```

### Example 3: Another Persian Word
```json
{
    "original_word": "Goal",
    "wrong_translation": "گل اشتباه",
    "correct_translation": "گل",
    "language_code": "fa"
}
```

**Expected Response (201):**
```json
{
    "success": true,
    "message": "Translation stored successfully",
    "data": {
        "original_word": "Football",
        "wrong_translation": "فوتبال نادرست",
        "correct_translation": "فوتبال",
        "language_code": "fa"
    }
}
```

## 3. Get All Translations (GET)

**Endpoint:** `GET http://localhost:3000/api/v1/translations`

**Expected Response (200):**
```json
{
    "success": true,
    "count": 3,
    "data": [
        {
            "id": 1,
            "original_word": "Football",
            "wrong_translation": "فوتبال نادرست",
            "correct_translation": "فوتبال",
            "language_code": "fa",
            "created_at": "2024-01-15T10:30:00.000Z",
            "updated_at": "2024-01-15T10:30:00.000Z"
        },
        {
            "id": 2,
            "original_word": "Match",
            "wrong_translation": "مباراة خاطئة",
            "correct_translation": "مباراة",
            "language_code": "ar",
            "created_at": "2024-01-15T10:31:00.000Z",
            "updated_at": "2024-01-15T10:31:00.000Z"
        }
    ]
}
```

## 4. Get Translations by Language (GET with Query)

**Endpoint:** `GET http://localhost:3000/api/v1/translations?language_code=fa`

**Expected Response (200):**
```json
{
    "success": true,
    "count": 2,
    "data": [
        {
            "id": 1,
            "original_word": "Football",
            "wrong_translation": "فوتبال نادرست",
            "correct_translation": "فوتبال",
            "language_code": "fa",
            "created_at": "2024-01-15T10:30:00.000Z",
            "updated_at": "2024-01-15T10:30:00.000Z"
        }
    ]
}
```

## 5. Update Existing Translation (POST - Same Key)

If you POST with the same `original_word`, `wrong_translation`, and `language_code`, it will UPDATE the `correct_translation`:

**Body:**
```json
{
    "original_word": "Football",
    "wrong_translation": "فوتبال نادرست",
    "correct_translation": "فوتبال صحیح",
    "language_code": "fa"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Translation stored successfully",
    "data": {
        "original_word": "Football",
        "wrong_translation": "فوتبال نادرست",
        "correct_translation": "فوتبال صحیح",
        "language_code": "fa"
    }
}
```

## Error Cases

### Missing Fields (400)
**Body:**
```json
{
    "original_word": "Football",
    "correct_translation": "فوتبال"
}
```

**Response:**
```json
{
    "success": false,
    "message": "All fields are required: original_word, wrong_translation, correct_translation, language_code"
}
```

## Language Codes Reference
- `fa` - Persian (Farsi)
- `ar` - Arabic
- `es` - Spanish
- `fr` - French
- `de` - German
- `tr` - Turkish
- `ru` - Russian
- `zh` - Chinese
