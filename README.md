### What is this?

During the Spiced Academy, we created this themed imageboard. 
Basically, it resembles a simple version of Instagram: You can upload pictures from your filesystem, provide title, username and a description, and use hashtags to tag and filter the images.
You can zoom in on the images, delete them from the website if they don’t match the „Disco“-theme, and have fun in the comment section.

It’s a simple and fun app. I’m quite happy with the styling. All images are downloaded from Pinterest. Feel free to add your own!

### Tech Stack

The imageboard uses:
- VueJS (CDN-Version)
- AWS S3 to store and load the images.
- Postgres to store and load comments, image links, usernames and all the other data.
- Heroku to host the application (Note: Heroku uses „Dynamos“, they freeze if they haven’t been accessed in some time, so it might take a while to load the site).
- Tailwindcss for styling
- NodeJS & Express for serving the app and connecting to the DB

### Easter Eggs

There’s three hidden easter eggs on the site. Can you find them?
