(function () {
    // Modal
    Vue.component('img-modal', {
        template: '#img-modal',
        props: ['imageId', 'lowestImageId', 'firstImageOnPageId'],
        /*** Data ***/
        data: function () {
            return {
                image: {
                    url: '',
                    username: '',
                    title: '',
                    description: '',
                    created: '',
                    comments: [],
                    tags: [],
                },
                newComment: {
                    comment: '',
                    username: '',
                },
                extraComment: {
                    comment: '',
                    username: '',
                },
                clickedCommentId: '',
                imageOnly: false,
                promptToDelete: false,
            };
        },
        /**** Methods ****/
        methods: {
            closeModal: function () {
                this.$emit('closemodal');
            },
            closeExtraCommentBox: function () {
                this.clickedCommentId = '';
            },
            stopPropagation: function (e) {
                e.stopPropagation();
            },
            postComment: function (e) {
                e.preventDefault();
                var vm = this;
                if (!vm.newComment.comment) return;
                axios
                    .post('/images/' + vm.imageId, {
                        username: vm.newComment.username,
                        comment: vm.newComment.comment,
                    })
                    .then(resp => {
                        vm.image.comments.unshift(resp.data);
                        vm.newComment.username = vm.newComment.comment = '';
                    })
                    .catch(err => {
                        console.log(err);
                    });
            },
            postExtraComment: function (commentId, index) {
                var vm = this;
                if (!vm.extraComment.comment) return;
                axios
                    .post('/images/comment/' + commentId, {
                        username: vm.extraComment.username,
                        comment: vm.extraComment.comment,
                        imageId: vm.imageId,
                    })
                    .then(function (resp) {
                        vm.image.comments[index].extraComments.unshift(
                            resp.data
                        );
                        vm.extraComment.username = vm.extraComment.comment = '';
                        vm.closeExtraCommentBox();
                    });
            },
            requestImage: function () {
                var vm = this;
                if (vm.imageId == 0) {
                    vm.closeModal();
                }
                axios
                    .get('/images/' + vm.imageId)
                    .then(function (resp) {
                        if (resp.data.found) {
                            delete resp.data.found;
                            resp.data.created = moment(
                                resp.data.created.replace(/T.+/, '')
                            ).format('MMM Do, YYYY');
                            vm.image = resp.data;
                        } else {
                            vm.closeModal();
                        }
                    })
                    .catch(function (err) {
                        console.log(err);
                    });
            },
            previousPicture: function () {
                this.$emit('previouspicture');
                this.closeExtraCommentBox();
            },
            nextPicture: function () {
                this.$emit('nextpicture');
                this.closeExtraCommentBox();
            },
            deleteImage: function () {
                this.$emit('deleteimage');
                this.closeExtraCommentBox();
            },
            findByTag: function (tag) {
                this.$emit('tagsearch', tag);
                this.closeModal();
            },
        },
        /***** Watch *****/
        watch: {
            imageId: function () {
                this.requestImage();
            },
            clickedCommentId: function () {
                this.extraComment.username = this.extraComment.comment = '';
            },
            'image.created': function () {},
        },
        /**** Mounted ****/
        mounted: function () {
            this.requestImage();
        },
    });

    // Main Instance
    new Vue({
        el: '#app',
        data: {
            images: [],
            imagesCopy: [],
            imagesTemp: [],
            imageId: location.hash.substring(1),
            allImageIds: [],
            chickenStyles: '',
            funkyPageStyles: '',
            funkyPage: false,
            funkyChicken: false,
            description: '',
            title: '',
            username: '',
            file: '',
            lowestImageId: null,
            imageLoaded: false,
            imageUpload: false,
            uploadPermitted: true,
            unseenUpdates: false,
            tags: '',
            openTags: false,
            tagsWarning: false,
            findTags: '',
            bugOn: false,
        },
        // Computed Values
        computed: {
            // last Image on Page
            lastImageOnPageId: function () {
                return this.images.length > 0
                    ? this.images[this.images.length - 1].id
                    : '';
            },
            moreImagesAvailable: function () {
                return !this.findTags
                    ? this.lastImageOnPageId != this.lowestImageId
                    : false;
            },
            // first Image on Page
            firstImageOnPageId: function () {
                return this.images.length > 0 ? this.images[0].id : '';
            },
        },
        watch: {
            images: function () {
                var vm = this;
                vm.images.forEach(image => {
                    image.style = vm.styleMe();
                });
            },
            tags: function () {
                if (
                    this.tags.search(/[!@$%^&*()_+\-=[\]{};':"\\|,.<>/?]/) != -1
                ) {
                    this.tagsWarning = true;
                } else {
                    this.tagsWarning = false;
                }
            },
            findTags: function () {
                if (this.findTags === '') {
                    this.images = this.imagesCopy;
                }
            },
            funkyPage: function () {
                var audio = document.getElementById('audio');
                if (this.funkyPage) {
                    audio.play();
                } else {
                    audio.pause();
                }
            },
        },
        // Methods
        methods: {
            /**** IMAGE RELATED ****/
            loadImages: function () {
                var vm = this;
                return axios
                    .get('/images')
                    .then(function (resp) {
                        vm.lowestImageId = resp.data.id;
                        vm.allImageIds = resp.data.imageIds;
                        vm.images = resp.data.images;
                        vm.imagesCopy = resp.data.images;
                    })
                    .catch(function (e) {
                        console.log(e);
                    });
            },
            setCurrentImgId: function (id) {
                this.currentImgId = id;
            },
            getMoreImages: function (imageId) {
                var vm = this;

                return axios
                    .get('/images/more/' + imageId)
                    .then(function (resp) {
                        vm.images = vm.images.concat(resp.data);
                        vm.imagesCopy = vm.imagesCopy.concat(resp.data);
                    })
                    .catch(function (e) {
                        console.log(e);
                    });
            },
            refreshImages: function () {
                var vm = this;

                axios
                    .get('/refresh/' + this.lastImageOnPageId)
                    .then(function (resp) {
                        vm.images = resp.data.images;
                        vm.lowestImageId = resp.data.id;
                        vm.allImageIds = resp.data.imageIds;
                        vm.unseenUpdates = false;
                    })
                    .catch(function (err) {
                        console.log(err);
                    });
            },
            findImage: function (e) {
                this.file = e.target.files[0];
                this.imageLoaded = true;
            },
            filterByTags: function (tag) {
                var vm = this;

                var tagSearch;

                if (tag && typeof tag === 'string') {
                    vm.findTags = tag;
                    tagSearch = tag.substring(1);
                } else {
                    tagSearch = vm.findTags.toLowerCase().match(/[a-z]+/);
                }

                axios.get('/images/tag/' + tagSearch).then(function (resp) {
                    vm.images = resp.data.images;
                });
            },
            submitTags: function () {
                const vm = this;
                if (vm.file && vm.title && vm.username) {
                    vm.uploadPermitted = true;
                    vm.imageUpload = true;
                    vm.openTags = true;
                } else {
                    vm.uploadPermitted = false;
                }
            },
            uploadImage: function () {
                const vm = this;
                vm.openTags = false;

                var formData = new FormData();

                // Handling tags
                if (vm.tags) {
                    var tagsList = vm.tags
                        .toLowerCase()
                        .match(/#[a-z]+/g)
                        .slice(0, 3);
                    vm.tags = '';
                    formData.append('tags', tagsList);
                }

                formData.append('title', vm.title);
                formData.append('description', vm.description);
                formData.append('username', vm.username);
                formData.append('file', vm.file);
                axios
                    .post('/images', formData)
                    .then(function (resp) {
                        vm.images.unshift(resp.data);
                        vm.allImageIds.unshift(resp.data.id);
                        vm.imageLoaded = vm.imageUpload = false;
                        vm.title = vm.description = vm.username = null;
                    })
                    .catch(function (error) {
                        console.log('post /images error: ', error);
                    });
            },
            deleteImage: function () {
                var vm = this;
                var imageId = vm.imageId;
                axios
                    .delete('images/' + imageId)
                    .then(function () {
                        vm.images = vm.images.filter(function (img) {
                            return img.id != imageId;
                        });

                        vm.allImageIds = vm.allImageIds.filter(function (id) {
                            return id != imageId;
                        });

                        vm.closeModal();
                    })
                    .catch(function (err) {
                        console.log(err);
                    });
            },
            /**** MODAL RELATED ****/
            closeModal: function () {
                this.imageId = '';
                history.replaceState(null, null, ' ');
            },
            previousPicture: function () {
                // Click Chevron, show previous picture
                var vm = this;
                this.imageId =
                    vm.allImageIds[
                        vm.allImageIds.indexOf(parseInt(vm.imageId)) - 1
                    ] || '';
                location.hash = vm.imageId;
            },
            nextPicture: function () {
                // Click Chevron, show next picture
                var vm = this;
                this.imageId =
                    vm.allImageIds[
                        vm.allImageIds.indexOf(parseInt(vm.imageId)) + 1
                    ] || '';

                location.hash = vm.imageId;
            },
            // **** Checking for Updated **** //
            checkForUpdates: function () {
                var vm = this;
                setInterval(function () {
                    axios
                        .get('/numImages')
                        .then(function (resp) {
                            var num = resp.data.num;
                            if (num > vm.allImageIds.length) {
                                vm.unseenUpdates = true;
                            } else {
                                return;
                            }
                        })
                        .catch(function (e) {
                            console.log(e);
                        });
                }, 5000);
            },
            // **** STYLE METHODS **** /
            styleMe: function () {
                var style = {};

                var colors = [
                    'border-red-400',
                    'border-yellow-400',
                    'border-green-400',
                    'border-purple-400',
                    'border-green-300',
                ];
                var gridPositions = ['self-end', 'self-center', 'self-start'];
                var rotations = [
                    'rotate-2',
                    'rotate-4',
                    'rotate-7',
                    'rotate-8',
                    'rotate-12',
                    '-rotate-1',
                    '-rotate-3',
                    '-rotate-5',
                    '-rotate-8',
                    '-rotate-10',
                    'rotate-0',
                ];

                var randomColor = Math.floor(Math.random() * colors.length);
                var randomGrid = Math.floor(
                    Math.random() * gridPositions.length
                );
                var randomRotation = Math.floor(
                    Math.random() * rotations.length
                );

                style[colors[randomColor]] = true;
                style[gridPositions[randomGrid]] = true;
                style[rotations[randomRotation]] = true;

                return style;
            },
            styleMeContinuously: function () {
                var vm = this;
                setInterval(function () {
                    vm.chickenStyles = vm.styleMe();
                }, 500);
            },
            showMeTheChicken: function () {
                if (!this.chickenStyles) {
                    this.styleMeContinuously();
                }
                this.funkyChicken = !this.funkyChicken;
            },
            getFunky: function () {
                var vm = this;
                setInterval(function () {
                    vm.funkyPageStyles = vm.styleMe();
                    // 467 is roughly the BPM of the EWF song
                }, 467);
                this.funkyPage = !this.funkyPage;
            },
        },
        // Life cycle methods
        mounted: function () {
            var vm = this;

            addEventListener('hashchange', function () {
                vm.imageId = location.hash.substring(1);
            });

            vm.loadImages();
            vm.checkForUpdates();
        },
    });
})();
