const express = require('express');
const app = express();
const uploader = require('./utils/uploader');
const {
    getFirstImages,
    getMoreImages,
    getAllImagesUntilId,
    getLowestImageId,
    getLastImageId,
    getAllImageIds,
    getAllImagesByTag,
    getNumberOfImages,
    getImageById,
    getCommentsByImageId,
    getTagsByImageId,
    addImage,
    addComment,
    addExtraComment,
    deleteImage,
} = require('./database/db');
const s3 = require('./utils/s3');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('./public'));

// Get The First couple of images, get the first image Id, get all Image Ids.
app.get('/images', (req, res) => {
    Promise.all([getFirstImages(), getLowestImageId(), getAllImageIds()])
        .then(([images, id, imageIds]) => {
            res.json({ images, id, imageIds });
        })
        .catch(e => {
            console.log(e);
            res.sendStatus(500);
        });
});

app.get('/images/tag/:tag', (req, res) => {
    const { tag } = req.params;

    getAllImagesByTag(tag)
        .then(images => {
            res.json({ images });
        })
        .catch(e => {
            console.log(e);
            res.sendStatus(500);
        });
});

// Get More Images, based on the last image on the page.
app.get('/images/more/:id', (req, res) => {
    const { id } = req.params;

    getMoreImages(id)
        .then(images => {
            res.json(images);
        })
        .catch(e => {
            console.log(e);
            res.sendStatus(500);
        });
});

// Get a specific image and comments for the modal.
app.get('/images/:id', (req, res) => {
    const { id } = req.params;
    getLastImageId()
        .then(maxId => {
            if (id > maxId) {
                res.json({ found: false });
            } else {
                return Promise.all([
                    getImageById(id),
                    getCommentsByImageId(id),
                    getTagsByImageId(id),
                ]).then(([image, comments, tags]) => {
                    res.json({ ...image, comments, found: true, tags });
                });
            }
        })
        .catch(() => res.redirect('/images'));
});

// get total number of images for refreshing purposes.
app.get('/numImages', (req, res) => {
    getNumberOfImages()
        .then(num => {
            res.json({ num });
        })
        .catch(e => {
            console.log(e);
            res.sendStatus(500);
        });
});

// Get new list of images after refresh; Load all the images that were included on the page.
app.get('/refresh/:id', (req, res) => {
    const { id } = req.params;

    Promise.all([getAllImagesUntilId(id), getLowestImageId(), getAllImageIds()])
        .then(([images, id, imageIds]) => {
            res.json({ images, id, imageIds });
        })
        .catch(e => {
            console.log(e);
            res.sendStatus(500);
        });
});

// Post a new comment to a specific image, by ID.
app.post('/images/:id', (req, res) => {
    const { id } = req.params;
    const { username, comment } = req.body;

    addComment(comment, username, id)
        .then(comment => {
            comment.extraComments = [];
            res.json(comment);
        })
        .catch(e => {
            console.log(e);
            res.sendStatus(500);
        });
});

// Post an Extra Comment to a specific comment by Id!
app.post('/images/comment/:commentId', (req, res) => {
    const { commentId } = req.params;
    const { username, comment, imageId } = req.body;

    addExtraComment(comment, username, commentId, imageId).then(comment => {
        res.json(comment);
    });
});

// Upload an image.
app.post('/images', uploader.single('file'), s3.upload, (req, res) => {
    const imageInfo = req.body;
    const { filename } = req.file;

    addImage(imageInfo, filename)
        .then(image => {
            res.json(image);
        })
        .catch(e => {
            console.log(e.message);
            res.sendStatus(500);
        });
});

// Delete an image by Id.
app.delete('/images/:id', (req, res) => {
    const { id } = req.params;

    deleteImage(id)
        .then(() => {
            res.sendStatus(200);
        })
        .catch(e => {
            console.log(e);
            res.sendStatus(500);
        });
});

const port = process.env.PORT || 8080;

app.listen(port, () => {
    console.log('App listening on ' + port);
});
