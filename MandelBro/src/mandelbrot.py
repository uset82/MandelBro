"""
MandelBro - Mandelbrot Set Generator Module

This module implements the core functionality for generating Mandelbrot set-based
terrain for the MandelBro game. It provides functions to calculate the Mandelbrot set,
generate height maps, and convert them to 3D terrain data.
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap
import json
import os

class MandelbrotGenerator:
    """
    A class to generate Mandelbrot set-based terrain for the MandelBro game.
    """
    
    def __init__(self, width=800, height=600, max_iterations=100):
        """
        Initialize the Mandelbrot generator with default parameters.
        
        Args:
            width (int): Width of the generated image
            height (int): Height of the generated image
            max_iterations (int): Maximum number of iterations for the Mandelbrot calculation
        """
        self.width = width
        self.height = height
        self.max_iterations = max_iterations
        self.center_x = -0.5
        self.center_y = 0
        self.zoom = 1.0
        self.color_map = self._create_default_colormap()
        
    def _create_default_colormap(self):
        """Create a default colormap for visualization."""
        colors = [(0, 0, 0.5), (0, 0, 1), (0, 0.5, 1), 
                 (0, 1, 1), (0.5, 1, 0.5), (1, 1, 0), 
                 (1, 0.5, 0), (1, 0, 0), (0.5, 0, 0)]
        return LinearSegmentedColormap.from_list("mandelbro", colors)
        
    def calculate_mandelbrot(self, x_min, x_max, y_min, y_max):
        """
        Calculate the Mandelbrot set within the specified bounds.
        
        Args:
            x_min, x_max, y_min, y_max: Bounds of the complex plane to calculate
            
        Returns:
            numpy.ndarray: 2D array of iteration counts
        """
        # Create a grid of complex numbers
        real, imag = np.meshgrid(
            np.linspace(x_min, x_max, self.width),
            np.linspace(y_min, y_max, self.height)
        )
        c = real + imag * 1j
        z = np.zeros_like(c)
        
        # Initialize the output array
        output = np.zeros(c.shape, dtype=int)
        mask = np.ones(c.shape, dtype=bool)
        
        # Perform the iteration
        for i in range(self.max_iterations):
            z[mask] = z[mask]**2 + c[mask]
            # Points that escape
            diverged = np.abs(z) > 2.0
            # Update output with current iteration count
            output[diverged & mask] = i
            # Update mask to exclude diverged points
            mask[diverged] = False
            # If all points have diverged, break early
            if not np.any(mask):
                break
                
        # Set max_iterations for points that never escaped
        output[mask] = self.max_iterations
        
        return output
    
    def generate_height_map(self, custom_params=None):
        """
        Generate a height map based on the Mandelbrot set.
        
        Args:
            custom_params (dict, optional): Custom parameters to override defaults
            
        Returns:
            numpy.ndarray: 2D array representing the height map
        """
        # Apply custom parameters if provided
        if custom_params:
            if 'center_x' in custom_params:
                self.center_x = custom_params['center_x']
            if 'center_y' in custom_params:
                self.center_y = custom_params['center_y']
            if 'zoom' in custom_params:
                self.zoom = custom_params['zoom']
            if 'max_iterations' in custom_params:
                self.max_iterations = custom_params['max_iterations']
        
        # Calculate the bounds based on center and zoom
        x_min = self.center_x - 1.5 / self.zoom
        x_max = self.center_x + 1.5 / self.zoom
        y_min = self.center_y - 1.0 / self.zoom
        y_max = self.center_y + 1.0 / self.zoom
        
        # Calculate the Mandelbrot set
        iterations = self.calculate_mandelbrot(x_min, x_max, y_min, y_max)
        
        # Normalize the height map
        height_map = iterations / self.max_iterations
        
        return height_map
    
    def visualize_height_map(self, height_map, output_path=None):
        """
        Visualize the height map as an image.
        
        Args:
            height_map (numpy.ndarray): The height map to visualize
            output_path (str, optional): Path to save the visualization
            
        Returns:
            matplotlib.figure.Figure: The figure object
        """
        plt.figure(figsize=(10, 8))
        plt.imshow(height_map, cmap=self.color_map)
        plt.colorbar(label='Height')
        plt.title('MandelBro Height Map')
        
        if output_path:
            plt.savefig(output_path, dpi=300, bbox_inches='tight')
            plt.close()
            return None
        
        return plt.gcf()
    
    def save_height_map(self, height_map, output_path):
        """
        Save the height map as a NumPy array file.
        
        Args:
            height_map (numpy.ndarray): The height map to save
            output_path (str): Path to save the height map
        """
        np.save(output_path, height_map)
    
    def load_height_map(self, input_path):
        """
        Load a height map from a NumPy array file.
        
        Args:
            input_path (str): Path to the height map file
            
        Returns:
            numpy.ndarray: The loaded height map
        """
        return np.load(input_path)
    
    def convert_to_3d_mesh_data(self, height_map, scale_factor=50.0):
        """
        Convert a height map to 3D mesh data.
        
        Args:
            height_map (numpy.ndarray): The height map to convert
            scale_factor (float): Scaling factor for height values
            
        Returns:
            dict: Dictionary containing vertices, faces, and normals
        """
        height, width = height_map.shape
        
        # Create vertices
        vertices = []
        for y in range(height):
            for x in range(width):
                # Scale x and y to be centered
                scaled_x = (x - width/2) / width
                scaled_y = (y - height/2) / height
                # Get height from height map
                z = height_map[y, x] * scale_factor
                vertices.append([scaled_x, scaled_y, z])
        
        # Create faces (triangles)
        faces = []
        for y in range(height-1):
            for x in range(width-1):
                # Calculate vertex indices
                i = y * width + x
                # Create two triangles for each grid cell
                faces.append([i, i+1, i+width])
                faces.append([i+1, i+width+1, i+width])
        
        # Calculate simple normals (not optimized)
        normals = [[0, 0, 1] for _ in range(len(vertices))]
        
        return {
            'vertices': vertices,
            'faces': faces,
            'normals': normals
        }
    
    def export_to_json(self, mesh_data, output_path):
        """
        Export 3D mesh data to a JSON file for use in web-based renderers.
        
        Args:
            mesh_data (dict): The mesh data to export
            output_path (str): Path to save the JSON file
        """
        with open(output_path, 'w') as f:
            json.dump(mesh_data, f)
    
    def generate_world_from_description(self, description, output_dir):
        """
        Generate a world based on a text description.
        
        This is a simplified version that maps certain keywords to parameters.
        A more advanced implementation would use NLP to interpret descriptions.
        
        Args:
            description (str): Text description of the desired world
            output_dir (str): Directory to save the generated files
            
        Returns:
            dict: Information about the generated world
        """
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)
        
        # Simple keyword mapping (would be replaced with NLP in a full implementation)
        params = {
            'center_x': self.center_x,
            'center_y': self.center_y,
            'zoom': self.zoom,
            'max_iterations': self.max_iterations
        }
        
        # Very simple keyword detection (would be much more sophisticated in reality)
        description = description.lower()
        
        if 'mountain' in description:
            params['zoom'] = 2.5
            params['center_x'] = -0.7
        elif 'ocean' in description or 'water' in description:
            params['zoom'] = 1.2
            params['center_x'] = -0.4
            params['center_y'] = 0.6
        elif 'desert' in description or 'sand' in description:
            params['zoom'] = 3.0
            params['center_x'] = -0.1
            params['center_y'] = -0.8
        elif 'forest' in description or 'jungle' in description:
            params['zoom'] = 4.0
            params['center_x'] = -1.4
            params['center_y'] = 0.0
        elif 'cave' in description or 'underground' in description:
            params['zoom'] = 8.0
            params['center_x'] = -0.743643887037158
            params['center_y'] = 0.131825904205330
        elif 'island' in description:
            params['zoom'] = 0.8
            params['center_x'] = -0.5
            params['center_y'] = 0
        elif 'minecraft' in description or 'blocky' in description:
            # For Minecraft-like worlds, we'll quantize the height map later
            params['zoom'] = 1.5
            params['center_x'] = -0.65
            params['max_iterations'] = 50
        
        # Generate the height map
        height_map = self.generate_height_map(params)
        
        # For Minecraft-like worlds, quantize the height map
        if 'minecraft' in description or 'blocky' in description:
            height_map = np.floor(height_map * 10) / 10
        
        # Save visualization
        vis_path = os.path.join(output_dir, 'height_map_visualization.png')
        self.visualize_height_map(height_map, vis_path)
        
        # Save raw height map
        height_map_path = os.path.join(output_dir, 'height_map.npy')
        self.save_height_map(height_map, height_map_path)
        
        # Convert to 3D mesh data
        mesh_data = self.convert_to_3d_mesh_data(height_map)
        
        # Export to JSON
        json_path = os.path.join(output_dir, 'terrain_mesh.json')
        self.export_to_json(mesh_data, json_path)
        
        # Return information about the generated world
        return {
            'description': description,
            'parameters': params,
            'files': {
                'visualization': vis_path,
                'height_map': height_map_path,
                'mesh_data': json_path
            }
        }


# Example usage
if __name__ == "__main__":
    # Create a generator
    generator = MandelbrotGenerator(width=800, height=600, max_iterations=100)
    
    # Generate a height map
    height_map = generator.generate_height_map()
    
    # Visualize and save
    generator.visualize_height_map(height_map, "example_height_map.png")
    
    # Generate a world from description
    world_info = generator.generate_world_from_description(
        "A mountainous island with caves", 
        "example_world"
    )
    
    print(f"Generated world: {world_info}")
