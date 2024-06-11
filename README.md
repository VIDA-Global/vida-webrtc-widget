# Vida Agent Embeddable WebRTC Widget

A simple embeddable script to allow Vida agents to be called from any website via SIP over WebRTC.

## Live example

A live example can be seen here: [Live Example](https://vidapublic.s3.us-east-2.amazonaws.com/vida-webrtc-widget/index.html)

## Integration

The widget can be integrated into any web page by creating a div with the proper class identifier and parameters, and referencing the js and css files as resources.

**Note that the resources should only be included once in a page, even if injecting the widget several times.**

Here follows an example integration:

```html

<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta
      name="description"
      content="An embeddable WebRTC client for calling Vida Agents."
    />
    <link rel="icon" type="image/png" href="%PUBLIC_URL%/favicon.png" />
    <title>Vida Widget Demo</title>
  </head>
  <body style="margin: 25px">
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <!-- 
      -- data-agent = the vida agent username you want to embed (required)
      -- data-welcome = text that will be shown when hovering over the widget. Default: "Talk to our AI!"
      -- data-size = "expanded" if you want the widget pre-expanded without needing hover
    -->
    <div 
      id="webrtc-widget"
      class="vida-webrtc-widget"
      data-agent="vidasales"
      data-welcome="Talk to our AI!"
      data-size="normal"
    ></div>
    <link rel="stylesheet" href="https://vidapublic.s3.us-east-2.amazonaws.com/vida-webrtc-widget/index.css">
    <script src="https://vidapublic.s3.us-east-2.amazonaws.com/vida-webrtc-widget/index.js"></script>
  </body>
</html>

```

## Building

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