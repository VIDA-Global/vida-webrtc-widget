# Vida Agent Embeddable WebRTC Widget

A simple embeddable script to allow Vida agents to be called from any website via SIP over WebRTC.

### `npm install`

Install all dependencies

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm build:widget`

Builds the app as an embeddable widget. Creates two files :
- index.js
- index.css

That can be included in any web page to trigger the load of the widget.

## Integration

Once built, the widget can be integrated by creating a div with the proper class identifier and parameters, and referencing the js and css files as resources.

**Note that the resources should only be included once in a page, even if injecting the widget several times.**

Here follows an example integration :

```html
...
<div id="something-in-your-website">
  <div class="vida-agent-widget" data-agent="pressdemo">
  </div>
</div>
...
...
<div id="something-else-in-your-website">
  <div class="vida-agent-widget" data-agent="vidasales">
  </div>
</div>
<!-- /!\ Only add these two tags once per page -->
<link rel="stylesheet" href="https://vidapublic.s3.us-east-2.amazonaws.com/vida-webrtc-widget/index.css">
<script src="https://vidapublic.s3.us-east-2.amazonaws.com/vida-webrtc-widget/index.js"></script>
...
```
