"""
MandelBro - Natural Language Processing Module

This module handles the interpretation of user descriptions for world generation.
It processes text and voice inputs to extract parameters for the Mandelbrot set generator.
"""

import re
import json
import os
import numpy as np
from collections import defaultdict

class DescriptionProcessor:
    """
    A class to process natural language descriptions and convert them to
    Mandelbrot set parameters for world generation.
    """
    
    def __init__(self, keywords_file=None):
        """
        Initialize the description processor.
        
        Args:
            keywords_file (str, optional): Path to a JSON file containing keyword mappings
        """
        self.biome_keywords = {
            'mountain': {'zoom': 2.5, 'center_x': -0.7, 'center_y': 0.1, 'max_iterations': 120},
            'ocean': {'zoom': 1.2, 'center_x': -0.4, 'center_y': 0.6, 'max_iterations': 80},
            'desert': {'zoom': 3.0, 'center_x': -0.1, 'center_y': -0.8, 'max_iterations': 60},
            'forest': {'zoom': 4.0, 'center_x': -1.4, 'center_y': 0.0, 'max_iterations': 100},
            'cave': {'zoom': 8.0, 'center_x': -0.743643887037158, 'center_y': 0.131825904205330, 'max_iterations': 150},
            'island': {'zoom': 0.8, 'center_x': -0.5, 'center_y': 0, 'max_iterations': 90},
            'minecraft': {'zoom': 1.5, 'center_x': -0.65, 'center_y': 0.1, 'max_iterations': 50, 'quantize': True},
            'blocky': {'zoom': 1.5, 'center_x': -0.65, 'center_y': 0.1, 'max_iterations': 50, 'quantize': True},
            'valley': {'zoom': 2.0, 'center_x': -0.2, 'center_y': 0.7, 'max_iterations': 110},
            'canyon': {'zoom': 3.5, 'center_x': -0.8, 'center_y': -0.2, 'max_iterations': 130},
            'volcano': {'zoom': 5.0, 'center_x': -0.75, 'center_y': 0.1, 'max_iterations': 140},
            'lake': {'zoom': 1.8, 'center_x': -0.5, 'center_y': 0.5, 'max_iterations': 85},
            'river': {'zoom': 2.2, 'center_x': -0.6, 'center_y': 0.4, 'max_iterations': 95},
            'hills': {'zoom': 1.7, 'center_x': -0.3, 'center_y': 0.2, 'max_iterations': 70},
            'plains': {'zoom': 1.0, 'center_x': -0.2, 'center_y': 0.0, 'max_iterations': 50},
            'swamp': {'zoom': 2.3, 'center_x': -0.9, 'center_y': 0.3, 'max_iterations': 75},
            'jungle': {'zoom': 4.2, 'center_x': -1.3, 'center_y': 0.1, 'max_iterations': 110},
            'tundra': {'zoom': 1.5, 'center_x': -0.4, 'center_y': -0.5, 'max_iterations': 65},
            'ice': {'zoom': 1.6, 'center_x': -0.3, 'center_y': -0.6, 'max_iterations': 60},
            'snow': {'zoom': 1.6, 'center_x': -0.3, 'center_y': -0.6, 'max_iterations': 60}
        }
        
        self.feature_keywords = {
            'tall': {'height_scale': 1.5},
            'short': {'height_scale': 0.5},
            'flat': {'height_scale': 0.3},
            'steep': {'height_scale': 2.0},
            'gentle': {'height_scale': 0.7},
            'rough': {'roughness': 1.5},
            'smooth': {'roughness': 0.5},
            'colorful': {'color_intensity': 1.5},
            'dark': {'color_intensity': 0.7},
            'bright': {'color_intensity': 1.3},
            'deep': {'depth': 1.5},
            'shallow': {'depth': 0.5},
            'wide': {'width': 1.5},
            'narrow': {'width': 0.7},
            'big': {'scale': 1.5},
            'small': {'scale': 0.7},
            'huge': {'scale': 2.0},
            'tiny': {'scale': 0.4}
        }
        
        self.entity_keywords = {
            'tree': {'entities': ['tree'], 'density': 0.8},
            'trees': {'entities': ['tree'], 'density': 1.0},
            'rock': {'entities': ['rock'], 'density': 0.6},
            'rocks': {'entities': ['rock'], 'density': 0.8},
            'flower': {'entities': ['flower'], 'density': 0.7},
            'flowers': {'entities': ['flower'], 'density': 1.0},
            'grass': {'entities': ['grass'], 'density': 1.0},
            'bush': {'entities': ['bush'], 'density': 0.6},
            'bushes': {'entities': ['bush'], 'density': 0.9},
            'animal': {'entities': ['animal'], 'density': 0.5},
            'animals': {'entities': ['animal'], 'density': 0.8},
            'fish': {'entities': ['fish'], 'density': 0.7},
            'fishes': {'entities': ['fish'], 'density': 0.9},
            'bird': {'entities': ['bird'], 'density': 0.6},
            'birds': {'entities': ['bird'], 'density': 0.8},
            'cloud': {'entities': ['cloud'], 'density': 0.5},
            'clouds': {'entities': ['cloud'], 'density': 0.8},
            'star': {'entities': ['star'], 'density': 0.7},
            'stars': {'entities': ['star'], 'density': 1.0},
            'house': {'entities': ['house'], 'density': 0.4},
            'houses': {'entities': ['house'], 'density': 0.6},
            'castle': {'entities': ['castle'], 'density': 0.3},
            'castles': {'entities': ['castle'], 'density': 0.5},
            'bridge': {'entities': ['bridge'], 'density': 0.3},
            'bridges': {'entities': ['bridge'], 'density': 0.5},
            'road': {'entities': ['road'], 'density': 0.5},
            'roads': {'entities': ['road'], 'density': 0.7},
            'path': {'entities': ['path'], 'density': 0.6},
            'paths': {'entities': ['path'], 'density': 0.8},
            'river': {'entities': ['river'], 'density': 0.5},
            'rivers': {'entities': ['river'], 'density': 0.7},
            'lake': {'entities': ['lake'], 'density': 0.4},
            'lakes': {'entities': ['lake'], 'density': 0.6},
            'ocean': {'entities': ['ocean'], 'density': 0.3},
            'oceans': {'entities': ['ocean'], 'density': 0.5},
            'mountain': {'entities': ['mountain'], 'density': 0.4},
            'mountains': {'entities': ['mountain'], 'density': 0.7},
            'hill': {'entities': ['hill'], 'density': 0.5},
            'hills': {'entities': ['hill'], 'density': 0.8},
            'valley': {'entities': ['valley'], 'density': 0.4},
            'valleys': {'entities': ['valley'], 'density': 0.6},
            'canyon': {'entities': ['canyon'], 'density': 0.3},
            'canyons': {'entities': ['canyon'], 'density': 0.5},
            'volcano': {'entities': ['volcano'], 'density': 0.2},
            'volcanoes': {'entities': ['volcano'], 'density': 0.4},
            'cave': {'entities': ['cave'], 'density': 0.3},
            'caves': {'entities': ['cave'], 'density': 0.5},
            'forest': {'entities': ['tree'], 'density': 1.0},
            'forests': {'entities': ['tree'], 'density': 1.2},
            'jungle': {'entities': ['tree', 'bush'], 'density': 1.5},
            'jungles': {'entities': ['tree', 'bush'], 'density': 1.7},
            'desert': {'entities': ['cactus', 'rock'], 'density': 0.4},
            'deserts': {'entities': ['cactus', 'rock'], 'density': 0.6},
            'tundra': {'entities': ['rock', 'snow'], 'density': 0.5},
            'tundras': {'entities': ['rock', 'snow'], 'density': 0.7},
            'swamp': {'entities': ['tree', 'water'], 'density': 0.8},
            'swamps': {'entities': ['tree', 'water'], 'density': 1.0},
            'plain': {'entities': ['grass'], 'density': 0.9},
            'plains': {'entities': ['grass'], 'density': 1.1},
            'beach': {'entities': ['sand'], 'density': 0.7},
            'beaches': {'entities': ['sand'], 'density': 0.9},
            'island': {'entities': ['tree', 'rock'], 'density': 0.6},
            'islands': {'entities': ['tree', 'rock'], 'density': 0.8}
        }
        
        # Load custom keywords if provided
        if keywords_file and os.path.exists(keywords_file):
            with open(keywords_file, 'r') as f:
                custom_keywords = json.load(f)
                if 'biome_keywords' in custom_keywords:
                    self.biome_keywords.update(custom_keywords['biome_keywords'])
                if 'feature_keywords' in custom_keywords:
                    self.feature_keywords.update(custom_keywords['feature_keywords'])
                if 'entity_keywords' in custom_keywords:
                    self.entity_keywords.update(custom_keywords['entity_keywords'])
    
    def save_keywords(self, output_file):
        """
        Save the current keyword mappings to a JSON file.
        
        Args:
            output_file (str): Path to save the keywords
        """
        keywords = {
            'biome_keywords': self.biome_keywords,
            'feature_keywords': self.feature_keywords,
            'entity_keywords': self.entity_keywords
        }
        
        with open(output_file, 'w') as f:
            json.dump(keywords, f, indent=2)
    
    def preprocess_text(self, text):
        """
        Preprocess the input text for better keyword matching.
        
        Args:
            text (str): Input text description
            
        Returns:
            str: Preprocessed text
        """
        # Convert to lowercase
        text = text.lower()
        
        # Remove punctuation
        text = re.sub(r'[^\w\s]', ' ', text)
        
        # Replace multiple spaces with a single space
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def extract_keywords(self, text):
        """
        Extract keywords from the preprocessed text.
        
        Args:
            text (str): Preprocessed text description
            
        Returns:
            dict: Dictionary of extracted keywords by category
        """
        words = text.split()
        
        # Initialize result dictionary
        extracted = {
            'biomes': [],
            'features': [],
            'entities': []
        }
        
        # Extract biome keywords
        for word in words:
            if word in self.biome_keywords:
                extracted['biomes'].append(word)
            if word in self.feature_keywords:
                extracted['features'].append(word)
            if word in self.entity_keywords:
                extracted['entities'].append(word)
        
        return extracted
    
    def analyze_sentiment(self, text):
        """
        Perform simple sentiment analysis on the text.
        
        Args:
            text (str): Input text description
            
        Returns:
            dict: Sentiment scores
        """
        # This is a very simplified sentiment analysis
        # In a real implementation, you would use a proper NLP library
        
        positive_words = ['beautiful', 'amazing', 'wonderful', 'great', 'good', 'nice', 'lovely', 'fantastic', 'awesome', 'excellent']
        negative_words = ['ugly', 'terrible', 'horrible', 'bad', 'awful', 'nasty', 'dreadful', 'poor', 'unpleasant', 'disgusting']
        
        words = text.lower().split()
        
        positive_count = sum(1 for word in words if word in positive_words)
        negative_count = sum(1 for word in words if word in negative_words)
        
        total_count = len(words)
        if total_count == 0:
            return {'positive': 0.5, 'negative': 0.5}
        
        positive_score = positive_count / total_count
        negative_score = negative_count / total_count
        
        # Normalize to ensure they sum to 1
        if positive_score + negative_score == 0:
            positive_score = 0.5
            negative_score = 0.5
        else:
            total = positive_score + negative_score
            positive_score /= total
            negative_score /= total
        
        return {
            'positive': positive_score,
            'negative': negative_score
        }
    
    def process_description(self, description):
        """
        Process a natural language description to extract Mandelbrot parameters.
        
        Args:
            description (str): User's description of the desired world
            
        Returns:
            dict: Parameters for the Mandelbrot generator
        """
        # Preprocess the text
        processed_text = self.preprocess_text(description)
        
        # Extract keywords
        keywords = self.extract_keywords(processed_text)
        
        # Analyze sentiment
        sentiment = self.analyze_sentiment(processed_text)
        
        # Initialize default parameters
        params = {
            'center_x': -0.5,
            'center_y': 0,
            'zoom': 1.0,
            'max_iterations': 100,
            'height_scale': 1.0,
            'roughness': 1.0,
            'color_intensity': 1.0,
            'quantize': False,
            'entities': [],
            'entity_density': 0.5
        }
        
        # Apply biome parameters (using the first found biome as primary)
        if keywords['biomes']:
            primary_biome = keywords['biomes'][0]
            biome_params = self.biome_keywords[primary_biome]
            params.update(biome_params)
            
            # If there are multiple biomes, blend them
            if len(keywords['biomes']) > 1:
                secondary_biome = keywords['biomes'][1]
                secondary_params = self.biome_keywords[secondary_biome]
                
                # Simple blending (average)
                for key in ['center_x', 'center_y', 'zoom', 'max_iterations']:
                    if key in secondary_params:
                        params[key] = (params[key] + secondary_params[key]) / 2
        
        # Apply feature modifiers
        for feature in keywords['features']:
            feature_params = self.feature_keywords[feature]
            params.update(feature_params)
        
        # Collect entities
        entity_set = set()
        total_density = 0
        count = 0
        
        for entity in keywords['entities']:
            entity_params = self.entity_keywords[entity]
            if 'entities' in entity_params:
                for e in entity_params['entities']:
                    entity_set.add(e)
            if 'density' in entity_params:
                total_density += entity_params['density']
                count += 1
        
        if entity_set:
            params['entities'] = list(entity_set)
        
        if count > 0:
            params['entity_density'] = total_density / count
        
        # Apply sentiment influence
        if sentiment['positive'] > 0.6:
            # More colorful and varied for positive descriptions
            params['color_intensity'] *= 1.2
            params['max_iterations'] = int(params['max_iterations'] * 1.1)
        elif sentiment['negative'] > 0.6:
            # Darker and more rugged for negative descriptions
            params['color_intensity'] *= 0.8
            params['roughness'] *= 1.2
        
        return params
    
    def generate_world_parameters(self, description):
        """
        Generate complete world parameters from a description.
        
        Args:
            description (str): User's description of the desired world
            
        Returns:
            dict: Complete world parameters including Mandelbrot settings and entities
        """
        # Process the description to get basic parameters
        params = self.process_description(description)
        
        # Generate a unique seed based on the description
        # This ensures the same description always generates the same world
        seed = hash(description) % 1000000
        np.random.seed(seed)
        
        # Add some randomness to make each world unique
        # but still influenced by the description
        params['center_x'] += np.random.uniform(-0.05, 0.05)
        params['center_y'] += np.random.uniform(-0.05, 0.05)
        params['zoom'] *= np.random.uniform(0.95, 1.05)
        
        # Add world metadata
        params['description'] = description
        params['seed'] = seed
        params['world_id'] = f"world_{seed}"
        params['created_at'] = None  # Would be set to current time in a real implementation
        
        return params


# Example usage
if __name__ == "__main__":
    processor = DescriptionProcessor()
    
    # Test with a few descriptions
    descriptions = [
        "A beautiful mountain landscape with tall trees and a river",
        "A desert with cactus and rocks",
        "A Minecraft-like world with blocky terrain and caves",
        "An island paradise with beaches and palm trees",
        "A dark and scary forest with deep caves"
    ]
    
    for desc in descriptions:
        params = processor.generate_world_parameters(desc)
        print(f"\nDescription: {desc}")
        print(f"Parameters: {json.dumps(params, indent=2)}")
