# Extrovert.js #

**Extrovert.js transforms your data into textured 3D geometry**. It supports physics, animations, cross-browser rendering, mouse and keyboard controls, and a five-minute install. It's intended for 3Dification of anything from on-page HTML to JSON responses fetched over AJAX to custom data formats specific to you or your project. [Visit the official project website](http://extrovert3d.com).

![](../gh-pages/extrovert_famous_photos.jpg)
![](../gh-pages/extrovert_art_of_war.jpg)
![](../gh-pages/extrovert_xkcdown.jpg)
![](../gh-pages/extrovert_cards.jpg)

## License ##

Extrovert.js 0.1.0 is permissively licensed under MIT. See [license.md](LICENSE.md) for details.

## Features ##

- **Create complex, data-driven 3D scenes** using Extrovert's system of customizable generators, rasterizers, adapters, and left-handed spin-widgets.
- **Extrude HTML/DOM content into three dimensions**, optionally preserving the on-screen location of 3Dified elements.
- **3Dify arbitrary data including XML, JSON, RSS**, or any other format. If you can access it with JavaScript, you can render it with Extrovert.
- **Smash your data into other data with pluggable physics support** with collisions, gravity, constraints, etc.
- **Let your users navigate the scene with optional mouse and keyboard controls** mappable to translation or rotation around the major axes.
- **Only crashes in certain browsers!** with degradable WebGL, Canvas, and CSS3 rendering.
- **Perspective and orthographic camera** support.
- **Multiple script loader formats for maximum possible compatibility/confusion** with modern script loaders including Require.js and Browserify.
- **Automated tests** through QUnit and Mocha...are forthcoming!
- **No jQuery dependency**. Extrovert is jQuery-compatible, but doesn't require jQuery.

Extrovert is actively developed and maintained from our underground jungle laboratory. [Contributions are welcome!](CONTRIBUTE.md).

## Quick Start ##

The quickest way to get started with Extrovert is to link to the sources directly. Extrovert also supports AMD/CommonJS script loaders like Require.js or Browserify.

1. Download the Extrovert sources manually or via Bower:

    ```bash
    bower install extrovert
    ```

2. Link to the sources in your HTML.

    ```html
    <script src="/path/to/extrovert.min.js" type="text/javascript"></script>
    ```

3. Initialize the Extrovert library:

    ```javascript
    extrovert.init('#target', { /* options */ });
    ```

    If you're using jQuery, you can access Extrovert like this:

    ```javascript
    $('#target').extrovert({ /* options */ });
    ```

4. Voila. Insta-3D. Go forth, and annoy thy users.

## Generators ##

Extrovert.js is built around the concept of generators. A *generator* is a piece of self-contained JavaScript code that generates 3D geometry according to a creative scheme or blueprint. Extrovert exposes the following built-in generators (and you can build your own):

- **extrude**. A generator that positions 3D objects based on their 2D screen positions.
- **direct**. A generator that positions 3D objects based on their 2D screen positions.
- **book**. A generator that creates "pamphlet" or "book" geometry from longform text content.
- **tile**. A generator that tiles 3D objects in space (like a brick wall).
- **stack**. A generator that stacks 3D objects in space (like a deck of cards).
- **box**. A generator that renders its data to the six sides of a cube.
- **river**. A generators that positions 3D objects in a constrained channel and gives them velocity.
- **custom**. You can create custom generators for Extrovert with just a few lines of code.

You can mix and match multiple generators within a single Extrovert scene. For example, here we're using the `extrude` generator to extrude any on-page images, and a `box` generator to turn a background div into a flat plane.

```javascript
extrovert.init('#target', {
  transforms: [
    { type: 'extrude' src: 'img' },
    { type: 'box' src: '#background' }
  ]
});
```

If a particular generator doesn't have the functionality you need, you can wire together multiple generators, create your own new generators, or modify the behavior of any existing generator.

## Rasterizers ##

A rasterizer is a self-contained piece of JavaScript code that renders arbitrary data to a 2D texture. Where generators create the 3D geometry that fills your scene, rasterizers create the textures, colors, and patterns that 3D geometry is decorated with.

As with generators, Extrovert ships with multiple built-in rasterizers, and as with generators, you can write your own. As of v1.0 the predefined rasterizers include:

- **img**. A rasterizer specifically for image resources.
- **elem**. A rasterizer for arbitrary HTML elements (`<div>`, `<span>`, `<p>`, whatever).
- **plain-text**. A rasterizer for plain unadorned text.
- **plain-text-stream**. A *streaming* rasterizer for longform text of arbitrary length.
- **html**. A full-fledged HTML rasterizer. Experimental.
- **custom**. You can define new rasterizers with just a few lines of code.

Short of writing a full-fledged rasterizer, you can also provide a rendering callback function that will allow you to perform the rasterization through simple canvas-style paint calls.
