DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS extra_comments;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS images;

CREATE TABLE images(
    id SERIAL PRIMARY KEY,
    url VARCHAR NOT NULL,
    username VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    description TEXT,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE comments(
    id SERIAL PRIMARY KEY,
    comment VARCHAR(255),
    username VARCHAR(255) NOT NULL, 
    image_id INT NOT NULL REFERENCES images(id)
);

CREATE TABLE extra_comments(
    id SERIAL PRIMARY KEY,
    comment VARCHAR(255),
    username VARCHAR(255),
    comment_id INT NOT NULL REFERENCES comments(id),
    image_id INT NOT NULL REFERENCES images(id)
);

CREATE TABLE tags(
    id SERIAL PRIMARY KEY,
    tag VARCHAR(30) NOT NULL,
    image_id INT NOT NULL REFERENCES images(id)
);
