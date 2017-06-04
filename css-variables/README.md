# css-variables
<h1>CSS Variables</h1>

<blockquote>CSS variables not to be confused with SASS or LESS variable.</blockquote>

<p>Variable is the one of main reason CSS Preprossor like SASS or LESS exist at all. Look at this simple SASS example,</p>
<p data-height="274" data-theme-id="0" data-slug-hash="QgWJzW" data-default-tab="css,result" data-user="mkumaran" data-embed-version="2" data-pen-title="CSS Variables" class="codepen">See the Pen <a href="https://codepen.io/mkumaran/pen/QgWJzW/">CSS Variables</a> by Muthu Kumaran (<a href="https://codepen.io/mkumaran">@mkumaran</a>) on <a href="https://codepen.io">CodePen</a>.</p>
<script async src="https://production-assets.codepen.io/assets/embed/ei.js"></script>
<p>The above code would do nothing in a browser. The browser wouldn't understand the declarations and toss them out. Preprocessors need to compile into CSS to be used. This code would compile to:</p>

<pre><code class="language-css">
div{
  border: 1px solid red;
  color: red;
}
</code></pre>

<p data-height="269" data-theme-id="0" data-slug-hash="rwNQqW" data-default-tab="css,result" data-user="mkumaran" data-embed-version="2" data-pen-title="rwNQqW" class="codepen">See the Pen <a href="https://codepen.io/mkumaran/pen/rwNQqW/">rwNQqW</a> by Muthu Kumaran (<a href="https://codepen.io/mkumaran">@mkumaran</a>) on <a href="https://codepen.io">CodePen</a>.</p>
<script async src="https://production-assets.codepen.io/assets/embed/ei.js"></script>

<p>This is now valid CSS. The variable was part of the preprocessor language, not CSS itself. Once the code compiles, the variables are gone.</p>
<p>Now CSS started supporting CSS variables and allows you to work with variables directly in the CSS. No compiling requires.</p>

<h2>What is CSS Variables?</h2>
<p>CSS Variables are entities defined by CSS authors which contain specific values to be reused throughout a document. It is a custom property which starts with <code>--</code> (double dash) and are accessed using the <code>var()</code> function.</p>

<h4>Basic Usage:</h4>
<p data-height="269" data-theme-id="0" data-slug-hash="MmNpbX" data-default-tab="css,result" data-user="mkumaran" data-embed-version="2" data-pen-title="MmNpbX" class="codepen">See the Pen <a href="https://codepen.io/mkumaran/pen/MmNpbX/">MmNpbX</a> by Muthu Kumaran (<a href="https://codepen.io/mkumaran">@mkumaran</a>) on <a href="https://codepen.io">CodePen</a>.</p>
<script async src="https://production-assets.codepen.io/assets/embed/ei.js"></script>
