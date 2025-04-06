"""
MandelBro - Procedural Asset Generator Module

This module handles the generation and placement of assets in the game world
based on the Mandelbrot set terrain and user descriptions.
"""

import os
import json
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap
import random

class AssetGenerator:
    """
    A class to generate and place assets in the MandelBro game world.
    """
    
    def __init__(self, assets_dir=None):
        """
        Initialize the asset generator.
        
        Args:
            assets_dir (str, optional): Directory containing asset templates
        """
        self.assets_dir = assets_dir
        
        # Define basic asset types and their properties
        self.asset_types = {
            'tree': {
                'height_range': (0.5, 5.0),
                'width_range': (0.3, 2.0),
                'color_range': [(0.0, 0.3, 0.0), (0.0, 0.8, 0.0)],
                'placement': 'land',
                'min_height': 0.2,
                'max_height': 0.8,
                'min_slope': 0.0,
                'max_slope': 0.4
            },
            'rock': {
                'height_range': (0.2, 1.5),
                'width_range': (0.3, 2.0),
                'color_range': [(0.3, 0.3, 0.3), (0.7, 0.7, 0.7)],
                'placement': 'land',
                'min_height': 0.1,
                'max_height': 0.9,
                'min_slope': 0.0,
                'max_slope': 0.8
            },
            'flower': {
                'height_range': (0.05, 0.2),
                'width_range': (0.05, 0.2),
                'color_range': [(0.8, 0.0, 0.0), (1.0, 0.8, 0.8)],
                'placement': 'land',
                'min_height': 0.2,
                'max_height': 0.7,
                'min_slope': 0.0,
                'max_slope': 0.3
            },
            'grass': {
                'height_range': (0.05, 0.3),
                'width_range': (0.05, 0.2),
                'color_range': [(0.0, 0.5, 0.0), (0.5, 0.8, 0.0)],
                'placement': 'land',
                'min_height': 0.2,
                'max_height': 0.7,
                'min_slope': 0.0,
                'max_slope': 0.5
            },
            'bush': {
                'height_range': (0.2, 1.0),
                'width_range': (0.3, 1.5),
                'color_range': [(0.0, 0.3, 0.0), (0.0, 0.6, 0.0)],
                'placement': 'land',
                'min_height': 0.2,
                'max_height': 0.7,
                'min_slope': 0.0,
                'max_slope': 0.4
            },
            'cactus': {
                'height_range': (0.5, 3.0),
                'width_range': (0.2, 1.0),
                'color_range': [(0.0, 0.4, 0.0), (0.0, 0.6, 0.0)],
                'placement': 'land',
                'min_height': 0.1,
                'max_height': 0.5,
                'min_slope': 0.0,
                'max_slope': 0.3
            },
            'water': {
                'height_range': (0.1, 0.5),
                'width_range': (1.0, 5.0),
                'color_range': [(0.0, 0.0, 0.5), (0.0, 0.5, 1.0)],
                'placement': 'water',
                'min_height': 0.0,
                'max_height': 0.3,
                'min_slope': 0.0,
                'max_slope': 0.1
            },
            'cloud': {
                'height_range': (0.2, 1.0),
                'width_range': (1.0, 5.0),
                'color_range': [(0.8, 0.8, 0.8), (1.0, 1.0, 1.0)],
                'placement': 'sky',
                'min_height': 0.0,
                'max_height': 1.0,
                'min_slope': 0.0,
                'max_slope': 1.0
            },
            'house': {
                'height_range': (1.0, 3.0),
                'width_range': (2.0, 5.0),
                'color_range': [(0.5, 0.3, 0.0), (0.8, 0.6, 0.4)],
                'placement': 'land',
                'min_height': 0.2,
                'max_height': 0.6,
                'min_slope': 0.0,
                'max_slope': 0.2
            },
            'castle': {
                'height_range': (3.0, 10.0),
                'width_range': (5.0, 15.0),
                'color_range': [(0.5, 0.5, 0.5), (0.7, 0.7, 0.7)],
                'placement': 'land',
                'min_height': 0.5,
                'max_height': 0.9,
                'min_slope': 0.0,
                'max_slope': 0.3
            },
            'bridge': {
                'height_range': (0.5, 2.0),
                'width_range': (1.0, 3.0),
                'color_range': [(0.5, 0.3, 0.0), (0.7, 0.5, 0.2)],
                'placement': 'water_crossing',
                'min_height': 0.2,
                'max_height': 0.5,
                'min_slope': 0.0,
                'max_slope': 0.3
            },
            'path': {
                'height_range': (0.05, 0.1),
                'width_range': (0.5, 1.0),
                'color_range': [(0.6, 0.5, 0.3), (0.8, 0.7, 0.5)],
                'placement': 'land',
                'min_height': 0.1,
                'max_height': 0.8,
                'min_slope': 0.0,
                'max_slope': 0.4
            },
            'river': {
                'height_range': (0.1, 0.5),
                'width_range': (1.0, 5.0),
                'color_range': [(0.0, 0.0, 0.5), (0.0, 0.5, 1.0)],
                'placement': 'water_flow',
                'min_height': 0.1,
                'max_height': 0.7,
                'min_slope': 0.05,
                'max_slope': 0.5
            },
            'lake': {
                'height_range': (0.1, 0.5),
                'width_range': (5.0, 20.0),
                'color_range': [(0.0, 0.0, 0.5), (0.0, 0.5, 1.0)],
                'placement': 'water_body',
                'min_height': 0.1,
                'max_height': 0.4,
                'min_slope': 0.0,
                'max_slope': 0.1
            },
            'mountain': {
                'height_range': (5.0, 20.0),
                'width_range': (5.0, 20.0),
                'color_range': [(0.3, 0.3, 0.3), (0.7, 0.7, 0.7)],
                'placement': 'land',
                'min_height': 0.6,
                'max_height': 1.0,
                'min_slope': 0.3,
                'max_slope': 1.0
            },
            'hill': {
                'height_range': (1.0, 5.0),
                'width_range': (3.0, 10.0),
                'color_range': [(0.0, 0.5, 0.0), (0.5, 0.8, 0.0)],
                'placement': 'land',
                'min_height': 0.3,
                'max_height': 0.7,
                'min_slope': 0.1,
                'max_slope': 0.5
            },
            'valley': {
                'height_range': (1.0, 5.0),
                'width_range': (5.0, 15.0),
                'color_range': [(0.0, 0.5, 0.0), (0.5, 0.8, 0.0)],
                'placement': 'land_depression',
                'min_height': 0.2,
                'max_height': 0.6,
                'min_slope': 0.1,
                'max_slope': 0.5
            },
            'canyon': {
                'height_range': (5.0, 15.0),
                'width_range': (2.0, 10.0),
                'color_range': [(0.5, 0.3, 0.0), (0.8, 0.6, 0.4)],
                'placement': 'land_depression',
                'min_height': 0.3,
                'max_height': 0.7,
                'min_slope': 0.5,
                'max_slope': 1.0
            },
            'volcano': {
                'height_range': (5.0, 15.0),
                'width_range': (5.0, 15.0),
                'color_range': [(0.5, 0.0, 0.0), (0.8, 0.3, 0.0)],
                'placement': 'land',
                'min_height': 0.6,
                'max_height': 1.0,
                'min_slope': 0.3,
                'max_slope': 1.0
            },
            'cave': {
                'height_range': (1.0, 5.0),
                'width_range': (1.0, 5.0),
                'color_range': [(0.1, 0.1, 0.1), (0.3, 0.3, 0.3)],
                'placement': 'land',
                'min_height': 0.2,
                'max_height': 0.8,
                'min_slope': 0.0,
                'max_slope': 1.0
            },
            'sand': {
                'height_range': (0.05, 0.2),
                'width_range': (1.0, 10.0),
                'color_range': [(0.8, 0.7, 0.4), (1.0, 0.9, 0.6)],
                'placement': 'land',
                'min_height': 0.1,
                'max_height': 0.3,
                'min_slope': 0.0,
                'max_slope': 0.2
            },
            'snow': {
                'height_range': (0.05, 0.2),
                'width_range': (1.0, 10.0),
                'color_range': [(0.8, 0.8, 0.9), (1.0, 1.0, 1.0)],
                'placement': 'land',
                'min_height': 0.7,
                'max_height': 1.0,
                'min_slope': 0.0,
                'max_slope': 1.0
            }
        }
        
        # Load custom assets if directory is provided
        if assets_dir and os.path.exists(assets_dir):
            self.load_custom_assets(assets_dir)
    
    def load_custom_assets(self, assets_dir):
        """
        Load custom asset definitions from a directory.
        
        Args:
            assets_dir (str): Directory containing asset JSON files
        """
        for filename in os.listdir(assets_dir):
            if filename.endswith('.json'):
                try:
                    with open(os.path.join(assets_dir, filename), 'r') as f:
                        asset_data = json.load(f)
                        if 'asset_type' in asset_data and 'properties' in asset_data:
                            self.asset_types[asset_data['asset_type']] = asset_data['properties']
                except Exception as e:
                    print(f"Error loading asset file {filename}: {e}")
    
    def save_asset_definitions(self, output_dir):
        """
        Save all asset definitions to JSON files.
        
        Args:
            output_dir (str): Directory to save asset definitions
        """
        os.makedirs(output_dir, exist_ok=True)
        
        for asset_type, properties in self.asset_types.items():
            output_file = os.path.join(output_dir, f"{asset_type}.json")
            with open(output_file, 'w') as f:
                json.dump({
                    'asset_type': asset_type,
                    'properties': properties
                }, f, indent=2)
    
    def calculate_slope(self, height_map):
        """
        Calculate the slope of the terrain from a height map.
        
        Args:
            height_map (numpy.ndarray): 2D array of height values
            
        Returns:
            numpy.ndarray: 2D array of slope values
        """
        # Calculate gradients in x and y directions
        gy, gx = np.gradient(height_map)
        
        # Calculate slope as magnitude of gradient
        slope = np.sqrt(gx**2 + gy**2)
        
        return slope
    
    def find_placement_locations(self, height_map, asset_type, density=1.0, seed=None):
        """
        Find suitable locations for placing assets based on terrain properties.
        
        Args:
            height_map (numpy.ndarray): 2D array of height values
            asset_type (str): Type of asset to place
            density (float): Density factor for asset placement (0.0 to 2.0)
            seed (int, optional): Random seed for reproducibility
            
        Returns:
            list: List of (x, y) coordinates for asset placement
        """
        if seed is not None:
            np.random.seed(seed)
            random.seed(seed)
        
        # Get asset properties
        if asset_type not in self.asset_types:
            print(f"Warning: Unknown asset type '{asset_type}', using default properties")
            asset_props = self.asset_types['tree']  # Default to tree properties
        else:
            asset_props = self.asset_types[asset_type]
        
        # Calculate slope
        slope = self.calculate_slope(height_map)
        
        # Normalize slope to 0-1 range
        max_slope = np.max(slope)
        if max_slope > 0:
            slope = slope / max_slope
        
        # Create mask for suitable locations
        height_mask = (height_map >= asset_props['min_height']) & (height_map <= asset_props['max_height'])
        slope_mask = (slope >= asset_props['min_slope']) & (slope <= asset_props['max_slope'])
        
        # Special handling for different placement types
        placement_type = asset_props['placement']
        placement_mask = np.ones_like(height_map, dtype=bool)
        
        if placement_type == 'water':
            # Water assets go in low areas
            placement_mask = height_map <= 0.3
        elif placement_type == 'water_body':
            # Water bodies go in flat, low areas
            placement_mask = (height_map <= 0.3) & (slope <= 0.1)
        elif placement_type == 'water_flow':
            # Rivers follow moderate slopes
            placement_mask = (height_map <= 0.5) & (slope >= 0.05) & (slope <= 0.5)
        elif placement_type == 'water_crossing':
            # Bridges cross water areas
            water_mask = height_map <= 0.3
            land_mask = height_map > 0.3
            # Find boundaries between water and land
            from scipy import ndimage
            water_dilated = ndimage.binary_dilation(water_mask)
            land_dilated = ndimage.binary_dilation(land_mask)
            placement_mask = water_dilated & land_dilated
        elif placement_type == 'land_depression':
            # Find local minima in the terrain
            from scipy import ndimage
            neighborhood_size = max(5, int(min(height_map.shape) / 20))
            footprint = np.ones((neighborhood_size, neighborhood_size))
            local_min = ndimage.minimum_filter(height_map, footprint=footprint)
            placement_mask = (height_map - local_min) < 0.1
        elif placement_type == 'sky':
            # Sky assets can go anywhere, but prefer higher altitudes
            placement_mask = np.ones_like(height_map, dtype=bool)
        
        # Combine all masks
        combined_mask = height_mask & slope_mask & placement_mask
        
        # Get coordinates of suitable locations
        y_coords, x_coords = np.where(combined_mask)
        
        if len(y_coords) == 0:
            return []
        
        # Determine number of assets to place based on density
        total_suitable = len(y_coords)
        base_count = int(np.sqrt(total_suitable) * 0.1)  # Base count scales with sqrt of suitable area
        count = max(1, int(base_count * density))
        count = min(count, total_suitable)  # Can't place more than available locations
        
        # Randomly select locations
        indices = np.random.choice(total_suitable, size=count, replace=False)
        
        # Return as list of (x, y) coordinates
        return [(x_coords[i], y_coords[i]) for i in indices]
    
    def generate_asset_properties(self, asset_type, seed=None):
        """
        Generate properties for a specific asset instance.
        
        Args:
            asset_type (str): Type of asset
            seed (int, optional): Random seed for reproducibility
            
        Returns:
            dict: Asset properties
        """
        if seed is not None:
            np.random.seed(seed)
            random.seed(seed)
        
        # Get asset type properties
        if asset_type not in self.asset_types:
            print(f"Warning: Unknown asset type '{asset_type}', using default properties")
            asset_props = self.asset_types['tree']  # Default to tree properties
        else:
            asset_props = self.asset_types[asset_type]
        
        # Generate random properties within ranges
        height = np.random.uniform(*asset_props['height_range'])
        width = np.random.uniform(*asset_props['width_range'])
        
        # Generate random color within range
        color_min, color_max = asset_props['color_range']
        color = [np.random.uniform(color_min[i], color_max[i]) for i in range(3)]
        
        # Generate random rotation
        rotation = np.random.uniform(0, 360)
        
        return {
            'type': asset_type,
            'height': height,
            'width': width,
            'color': color,
            'rotation': rotation
        }
    
    def place_assets(self, height_map, world_params, seed=None):
        """
        Place assets in the world based on height map and parameters.
        
        Args:
            height_map (numpy.ndarray): 2D array of height values
            world_params (dict): World generation parameters
            seed (int, optional): Random seed for reproducibility
            
        Returns:
            dict: Asset placement data
        """
        if seed is not None:
            master_seed = seed
        elif 'seed' in world_params:
            master_seed = world_params['seed']
        else:
            master_seed = np.random.randint(0, 1000000)
        
        # Get entities from world parameters
        entities = world_params.get('entities', [])
        entity_density = world_params.get('entity_density', 0.5)
        
        # If no entities specified, add some default ones based on biome
        if not entities:
            # Extract biome from center coordinates
            center_x = world_params.get('center_x', -0.5)
            center_y = world_params.get('center_y', 0)
            
            # Simple biome detection based on center coordinates
            if center_x < -0.7:
                entities = ['tree', 'rock', 'grass']  # Forest-like
            elif center_y > 0.5:
                entities = ['water', 'sand', 'grass']  # Ocean-like
            elif center_x > 0 and center_y < 0:
                entities = ['cactus', 'rock', 'sand']  # Desert-like
            else:
                entities = ['tree', 'grass', 'flower', 'rock']  # Default mixed
        
        # Initialize result
        assets = []
        
        # Place each entity type
        for i, entity_type in enumerate(entities):
            # Use a different seed for each entity type
            entity_seed = master_seed + i
            
            # Find suitable locations
            locations = self.find_placement_locations(
                height_map, 
                entity_type, 
                density=entity_density,
                seed=entity_seed
            )
            
            # Generate and place assets
            for j, (x, y) in enumerate(locations):
                # Use a different seed for each asset instance
                instance_seed = entity_seed + j
                
                # Generate asset properties
                props = self.generate_asset_properties(entity_type, seed=instance_seed)
                
                # Add position
                props['position'] = {
                    'x': x,
                    'y': y,
                    'z': height_map[y, x] * 50.0  # Scale height to match 3D conversion
                }
                
                # Add to assets list
                assets.append(props)
        
        return {
            'seed': master_seed,
            'count': len(assets),
            'assets': assets
        }
    
    def visualize_asset_placement(self, height_map, assets, output_path=None):
        """
        Visualize asset placement on the height map.
        
        Args:
            height_map (numpy.ndarray): 2D array of height values
            assets (dict): Asset placement data
            output_path (str, optional): Path to save the visualization
            
        Returns:
            matplotlib.figure.Figure: The figure object if output_path is None
        """
        # Create a colormap for the height map
        colors = [(0, 0, 0.5), (0, 0, 1), (0, 0.5, 1), 
                 (0, 1, 1), (0.5, 1, 0.5), (1, 1, 0), 
                 (1, 0.5, 0), (1, 0, 0), (0.5, 0, 0)]
        cmap = LinearSegmentedColormap.from_list("mandelbro", colors)
        
        # Create figure
        plt.figure(figsize=(12, 10))
        
        # Plot height map
        plt.imshow(height_map, cmap=cmap)
        
        # Define marker styles for different asset types
        marker_styles = {
            'tree': {'marker': '^', 'color': 'green', 'size': 30},
            'rock': {'marker': 's', 'color': 'gray', 'size': 20},
            'flower': {'marker': '*', 'color': 'magenta', 'size': 15},
            'grass': {'marker': '.', 'color': 'green', 'size': 10},
            'bush': {'marker': 'o', 'color': 'darkgreen', 'size': 20},
            'cactus': {'marker': '8', 'color': 'green', 'size': 25},
            'water': {'marker': 'o', 'color': 'blue', 'size': 20},
            'cloud': {'marker': 'o', 'color': 'white', 'size': 30},
            'house': {'marker': 'H', 'color': 'brown', 'size': 35},
            'castle': {'marker': 'H', 'color': 'darkgray', 'size': 40},
            'bridge': {'marker': '=', 'color': 'brown', 'size': 30},
            'path': {'marker': '.', 'color': 'brown', 'size': 10},
            'river': {'marker': 's', 'color': 'blue', 'size': 20},
            'lake': {'marker': 'o', 'color': 'blue', 'size': 40},
            'mountain': {'marker': '^', 'color': 'darkgray', 'size': 40},
            'hill': {'marker': '^', 'color': 'green', 'size': 30},
            'valley': {'marker': 'v', 'color': 'green', 'size': 30},
            'canyon': {'marker': 'v', 'color': 'brown', 'size': 35},
            'volcano': {'marker': '^', 'color': 'red', 'size': 40},
            'cave': {'marker': 'o', 'color': 'black', 'size': 25},
            'sand': {'marker': '.', 'color': 'yellow', 'size': 10},
            'snow': {'marker': '.', 'color': 'white', 'size': 10}
        }
        
        # Default marker style
        default_style = {'marker': 'o', 'color': 'red', 'size': 20}
        
        # Group assets by type for more efficient plotting
        assets_by_type = {}
        for asset in assets['assets']:
            asset_type = asset['type']
            if asset_type not in assets_by_type:
                assets_by_type[asset_type] = []
            assets_by_type[asset_type].append(asset)
        
        # Plot assets
        for asset_type, asset_list in assets_by_type.items():
            style = marker_styles.get(asset_type, default_style)
            
            # Extract positions
            x_positions = [asset['position']['x'] for asset in asset_list]
            y_positions = [asset['position']['y'] for asset in asset_list]
            
            # Plot with appropriate style
            plt.scatter(
                x_positions, 
                y_positions, 
                marker=style['marker'], 
                color=style['color'], 
                s=style['size'],
                alpha=0.7,
                label=asset_type
            )
        
        # Add legend
        if assets_by_type:
            plt.legend(loc='upper right', bbox_to_anchor=(1.1, 1.05))
        
        plt.title('MandelBro World with Assets')
        plt.colorbar(label='Height')
        
        if output_path:
            plt.savefig(output_path, dpi=300, bbox_inches='tight')
            plt.close()
            return None
        
        return plt.gcf()
    
    def export_assets_to_json(self, assets, output_path):
        """
        Export asset data to a JSON file.
        
        Args:
            assets (dict): Asset placement data
            output_path (str): Path to save the JSON file
        """
        with open(output_path, 'w') as f:
            json.dump(assets, f, indent=2)
    
    def generate_world_assets(self, height_map, world_params, output_dir):
        """
        Generate and place assets for a world, saving results to files.
        
        Args:
            height_map (numpy.ndarray): 2D array of height values
            world_params (dict): World generation parameters
            output_dir (str): Directory to save output files
            
        Returns:
            dict: Information about the generated assets
        """
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Place assets
        seed = world_params.get('seed', None)
        assets = self.place_assets(height_map, world_params, seed=seed)
        
        # Visualize asset placement
        vis_path = os.path.join(output_dir, 'asset_placement.png')
        self.visualize_asset_placement(height_map, assets, vis_path)
        
        # Export assets to JSON
        json_path = os.path.join(output_dir, 'assets.json')
        self.export_assets_to_json(assets, json_path)
        
        return {
            'asset_count': assets['count'],
            'files': {
                'visualization': vis_path,
                'asset_data': json_path
            }
        }


# Example usage
if __name__ == "__main__":
    import sys
    sys.path.append('..')
    from mandelbrot import MandelbrotGenerator
    
    # Create a Mandelbrot generator and generate a height map
    mandelbrot_gen = MandelbrotGenerator(width=400, height=300, max_iterations=100)
    height_map = mandelbrot_gen.generate_height_map()
    
    # Create an asset generator
    asset_gen = AssetGenerator()
    
    # Define some world parameters
    world_params = {
        'description': 'A forest with mountains and a river',
        'entities': ['tree', 'rock', 'river', 'mountain'],
        'entity_density': 0.8,
        'seed': 12345
    }
    
    # Generate and place assets
    assets_info = asset_gen.generate_world_assets(height_map, world_params, 'example_assets')
    
    print(f"Generated assets: {assets_info}")
