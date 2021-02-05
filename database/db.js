const db = require('./db_init');

// GETTING

function getImageById(imageId) {
    return db
        .query(
            `
        SELECT * FROM images
        WHERE id = $1`,
            [imageId]
        )
        .then(({ rows }) => rows[0]);
}

function getFirstImages() {
    return db
        .query(
            `
        SELECT * FROM images
        ORDER BY id DESC
        LIMIT 8`
        )
        .then(({ rows }) => rows);
}

function getMoreImages(lastId) {
    return db
        .query(
            `
        SELECT * FROM images
        WHERE id < $1
        ORDER BY id DESC
        LIMIT 8
        `,
            [lastId]
        )
        .then(({ rows }) => rows);
}

function getAllImagesUntilId(lastId) {
    return db
        .query(
            `
        SELECT * FROM images
        WHERE id >= $1
        ORDER BY id DESC`,
            [lastId]
        )
        .then(({ rows }) => rows);
}

function getAllImagesByTag(tag) {
    if (!tag.startsWith('#')) {
        tag = '#' + tag;
    }
    return db
        .query(
            `
        SELECT image_id FROM tags
        WHERE tag = $1`,
            [tag]
        )
        .then(({ rows }) => {
            return db.query(
                `
                SELECT * FROM images
                WHERE id = ANY ($1)`,
                [rows.map(entry => entry.image_id)]
            );
        })
        .then(({ rows }) => rows);
}

function getLowestImageId() {
    return db
        .query(
            `
        SELECT id FROM images
        ORDER BY id ASC
        LIMIT 1`
        )
        .then(({ rows }) => (rows.length > 0 ? rows[0].id : ''));
}

function getLastImageId() {
    return db
        .query(
            `
        SELECT id FROM images
        ORDER BY id DESC
        LIMIT 1`
        )
        .then(({ rows }) => rows[0].id);
}

function getAllImageIds() {
    return db
        .query(
            `
        SELECT id FROM images
        ORDER BY id DESC`
        )
        .then(({ rows }) => rows.map(row => row.id));
}

function getNumberOfImages() {
    return db
        .query(
            `
        SELECT COUNT(*) FROM images`
        )
        .then(({ rows }) => rows[0].count);
}

// Adding & Deleting

function addImage(imageInfo, url) {
    const { description, title, username, tags } = imageInfo;

    const awsUrl =
        (process.env == 'production' ? process.env : require('../secrets'))
            .AWS_URL + url;

    return db
        .query(
            `
        INSERT INTO images (url, username, title, description)
        VALUES ($1, $2, $3, $4)
        RETURNING id, url, username, title, description`,
            [awsUrl, username, title, description]
        )
        .then(({ rows }) => {
            if (!tags || tags.length <= 0) {
                return rows[0];
            } else {
                const addTagsPromises = [];
                tags.split(',').forEach(tag => {
                    const promise = db.query(
                        `
                    INSERT INTO tags (tag, image_id)
                    VALUES ($1, $2)`,
                        [tag, rows[0].id]
                    );
                    addTagsPromises.push(promise);
                });
                return Promise.all(addTagsPromises).then(() => rows[0]);
            }
        });
}

function deleteImage(imageId) {
    return db
        .query(
            `
        DELETE FROM tags
        WHERE image_id = $1`,
            [imageId]
        )
        .then(() =>
            db.query(
                `
        DELETE FROM extra_comments
        WHERE image_id = $1`,
                [imageId]
            )
        )
        .then(() =>
            db.query(
                `
        DELETE FROM comments
        WHERE image_id = $1`,
                [imageId]
            )
        )
        .then(() =>
            db.query(
                `
        DELETE FROM images
        WHERE id = $1`,
                [imageId]
            )
        );
}

// Tags
function getTagsByImageId(id) {
    return db
        .query(
            `
    SELECT tag FROM tags
    WHERE image_id = $1`,
            [id]
        )
        .then(({ rows }) => rows);
}

// Comments
function addComment(comment, username, imageId) {
    return db
        .query(
            `
        INSERT INTO comments(comment, username, image_id)
        VALUES($1, $2, $3)
        RETURNING id, comment, username`,
            [comment, username, imageId]
        )
        .then(({ rows }) => rows[0]);
}

function addExtraComment(comment, username, commentId, imageId) {
    return db
        .query(
            `
    INSERT INTO extra_comments(comment, username, comment_id, image_id)
    VALUES($1, $2, $3, $4)
    RETURNING comment, username
    `,
            [comment, username, commentId, imageId]
        )
        .then(({ rows }) => rows[0]);
}

function getCommentsByImageId(imageId) {
    return db
        .query(
            `
        SELECT * FROM comments
        WHERE image_id = $1
        ORDER BY id DESC`,
            [imageId]
        )
        .then(({ rows }) => {
            const comments = rows;
            const getExtraCommentsFor = [];
            comments.forEach(comment => {
                getExtraCommentsFor.push(
                    getExtraCommentsByCommentId(comment.id)
                );
            });

            return Promise.all(getExtraCommentsFor).then(results => {
                const extraComments = results.flat();

                comments.forEach(comment => {
                    const filteredExtraComments = extraComments.filter(
                        extraComment => extraComment.comment_id === comment.id
                    );

                    comment.extraComments = filteredExtraComments;
                });

                return comments;
            });
        });

    function getExtraCommentsByCommentId(commentId) {
        return db
            .query(
                `
                SELECT * FROM extra_comments
                WHERE comment_id = $1
                ORDER BY id DESC
            
            `,
                [commentId]
            )
            .then(({ rows }) => rows);
    }
}

module.exports = {
    getFirstImages,
    getMoreImages,
    getAllImagesUntilId,
    getAllImagesByTag,
    getLowestImageId,
    getLastImageId,
    getAllImageIds,
    getNumberOfImages,
    getImageById,
    getCommentsByImageId,
    getTagsByImageId,
    addImage,
    addComment,
    addExtraComment,
    deleteImage,
};
