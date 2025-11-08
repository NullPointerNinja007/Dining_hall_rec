
CREATE TABLE menu_item (
    item_id SERIAL PRIMARY KEY,
    hall_name TEXT NOT NULL,
    date_served DATE NOT NULL,
    meal_type VARCHAR(20) CHECK (meal_type IN ('Breakfast','Lunch','Dinner','Brunch')),
    name TEXT NOT NULL,
    station TEXT,
    ingredients TEXT,
    made_on_shared_equipment TEXT,
    allergens TEXT,
    diet_tags TEXT,
    category TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO menu_item
(hall_name, date_served, meal_type, name, station, ingredients, made_on_shared_equipment, allergens, diet_tags, category, notes)
VALUES
-- 1
('Wilbur Dining', '2025-11-08', 'Dinner', 
 'Rotisserie Chicken Carving Board', 
 'Carving Board',
 'chicken, garlic, thyme, oregano, salt, pepper',
 NULL,
 NULL,
 'GF, HAL',
 'Entrée',
 NULL),

-- 2
('Wilbur Dining', '2025-11-08', 'Dinner', 
 'Creamy Blackened Tofu',
 'Entrée Line',
 'tofu, oat milk, canola/olive oil blend, blackened seasoning (salt, chili pepper, paprika, garlic, red pepper), chicken flavor seasoning (garlic, salt, onion, spices, orange peel, paprika, bell peppers), onion, garlic, flour, cajun seasoning (garlic, black pepper, cayenne pepper, oregano, chili pepper, sea salt), nutritional yeast, vegetable soup base (carrots, celery, mushroom)',
 NULL,
 'SOY, WHEAT',
 'VG, V, HAL',
 'Entrée',
 NULL),

-- 3
('Wilbur Dining', '2025-11-08', 'Dinner',
 'Caramelized Sweet Potato & Greens Hash',
 'Entrée Line',
 'sweet potatoes, onion, bell peppers, kale, green onion, parsley, canola/olive oil blend, salt, pepper',
 'Made on shared equipment with COCONUT, EGG, FISH, MILK, PEANUTS, SESAME, SHELLFISH, SOY, TREENUTS, WHEAT',
 NULL,
 'VG, V, HAL',
 'Side',
 NULL),

-- 4
('Wilbur Dining', '2025-11-08', 'Dinner',
 'Seasonal Steamed Vegetables',
 'Sides',
 'seasonal vegetables, salt',
 NULL,
 NULL,
 'GF, VG, V, HAL',
 'Side',
 NULL),

-- 5
('Wilbur Dining', '2025-11-08', 'Dinner',
 'Seasonal Vegetable Board',
 'Sides',
 'artichokes, asparagus, green beans, beets, bok choy, broccoli, broccolini, brussels sprouts, carrots, cauliflower, mushrooms, okra, peas, bell peppers, chile peppers, potatoes, squash, sunchokes, sweet potatoes, tomatillos or tomatoes, herbs (chives, dill, oregano, parsley, rosemary, sage, tarragon, thyme), salt',
 NULL,
 NULL,
 'GF, VG, V, HAL',
 'Side',
 NULL),

-- 6
('Wilbur Dining', '2025-11-08', 'Dinner',
 'Spicy Green Beans',
 'Sides',
 'green beans, olive oil, garlic, red pepper flakes, salt',
 NULL,
 NULL,
 'GF, VG, V, HAL',
 'Side',
 NULL),

-- 7
('Wilbur Dining', '2025-11-08', 'Dinner',
 'Honey Butter Biscuit',
 'Bakery',
 'buttermilk biscuit (enriched bleached flour, shortening [palm oil], monoglycerides, glycerides, polysorbate 60), buttermilk powder, sugar, baking powder, salt, honey, butter',
 'Made on shared equipment with EGG, SESAME',
 'MILK, WHEAT',
 'V',
 'Side',
 NULL),

-- 8
('Wilbur Dining', '2025-11-08', 'Dinner',
 'Mashed Potatoes with Chives',
 'Sides',
 'potato, milk, butter, sour cream, chive, salt, pepper',
 NULL,
 'MILK',
 'GF, V',
 'Side',
 NULL),

-- 9
('Wilbur Dining', '2025-11-08', 'Dinner',
 'Grilled Chicken',
 'Burger Bar',
 'chicken, canola/olive oil blend, salt, pepper',
 'Made on shared equipment with COCONUT, EGG, FISH, MILK, PEANUTS, SESAME, SHELLFISH, SOY, TREENUTS, WHEAT',
 NULL,
 'GF, HAL',
 'Entrée',
 NULL),

-- 10
('Wilbur Dining', '2025-11-08', 'Dinner',
 'Grilled Vegan Option',
 'Burger Bar',
 'chef’s choice grilled vegan option',
 'Made on shared equipment with COCONUT, EGG, FISH, MILK, PEANUTS, SESAME, SHELLFISH, SOY, TREENUTS, WHEAT',
 NULL,
 'VG, V, HAL',
 'Entrée',
 NULL),

-- 11
('Wilbur Dining', '2025-11-08', 'Dinner',
 'Handmade Pizza',
 'Pizza Station',
 'wheat flour, yeast, sugar, olive oil, mozzarella cheese, marinara sauce',
 NULL,
 'MILK, WHEAT',
 'V, HAL',
 'Entrée',
 NULL),

-- 12
('Wilbur Dining', '2025-11-08', 'Dinner',
 'Panini Station',
 'Panini Station',
 'telera roll, chipotle aioli (soybean oil, eggs, vinegar, lemon juice concentrate, salt, sugar, dried garlic, paprika, tomato paste), roasted peppers, vinegar, beef pork salami, cheddar cheese, provolone cheese, pesto sauce (basil, arugula, tomato), salt',
 'Made on shared equipment with COCONUT, MILK, TREENUTS',
 'EGG, SOY, WHEAT',
 'V',
 'Entrée',
 NULL),

-- 13
('Wilbur Dining', '2025-11-08', 'Dinner',
 'Soup of the Day',
 'Soup Station',
 'chef’s choice soup of the day',
 NULL,
 NULL,
 'V, HAL',
 'Soup',
 NULL),

-- 14
('Wilbur Dining', '2025-11-08', 'Dinner',
 'Composed Salad',
 'Salad Bar',
 'chef’s choice composed salad',
 NULL,
 NULL,
 'HAL',
 'Salad',
 NULL),

-- 15
('Wilbur Dining', '2025-11-08', 'Dinner',
 'Performance Bar',
 'Performance Bar',
 'seasonal assortment of fresh vegetables, salads, beans, whole grains, hard boiled eggs, baked chicken, tofu, hummus, spinach',
 NULL,
 NULL,
 'GF, VG, V, HAL',
 'Station',
 NULL),

-- 16
('Wilbur Dining', '2025-11-08', 'Dinner',
 'Creamy Pesto',
 'Pasta Bar',
 'pesto sauce (basil, canola oil, parmesan cheese, olive oil, garlic, salt, lemon juice concentrate, rosemary extract, white sauce [flour, butter, milk powder, onion powder, garlic, nutmeg, salt]), parmesan cheese, parsley',
 NULL,
 'MILK, SOY, WHEAT',
 'V',
 'Entrée',
 NULL),

-- 17
('Wilbur Dining', '2025-11-08', 'Dinner',
 'Pasta Marinara',
 'Pasta Bar',
 'pasta, marinara sauce, canola/olive oil blend',
 'Made on shared equipment with EGG',
 'SOY, WHEAT',
 'VG, V, HAL',
 'Entrée',
 NULL),

-- 18
('Wilbur Dining', '2025-11-08', 'Dinner',
 'Penne Pasta (Gluten-Free)',
 'Pasta Bar',
 'brown rice, rice bran, water',
 NULL,
 NULL,
 'GF, V, HAL',
 'Entrée',
 NULL);
