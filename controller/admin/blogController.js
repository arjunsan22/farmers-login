const Blog = require('../../models/blogModel');
const sharp = require('sharp');
const path = require('path');

const loadAddBlogPage = async (req, res) => {
    try {
        res.render('addBlog');
    } catch (error) {
        res.redirect('/admin/error');
    }
};

const addBlog = async (req, res) => {
    try {
        const { name, description, deseases, remedies, cultivationTime, cultivationClimate,
             cultivationSoil, categoryName, pestisides, howToPlant } = req.body;
        
        // Handle main picture
        let mainPicture = '';
        if (req.files && req.files['picture']) {
            const file = req.files['picture'][0];
            const resizedImagePath = path.join('public/uploads/blog-images', `resized-${file.filename}`);
            await sharp(file.path)
                .resize({ width: 800, height: 600 })
                .toFile(resizedImagePath);
            mainPicture = `resized-${file.filename}`;
        }

        // Handle gallery pictures
        let galleryImages = [];
        if (req.files && req.files['pictureGallery']) {
            for (let file of req.files['pictureGallery']) {
                const resizedImagePath = path.join('public/uploads/blog-images', `gallery-${file.filename}`);
                await sharp(file.path)
                    .resize({ width: 800, height: 600 })
                    .toFile(resizedImagePath);
                galleryImages.push(`gallery-${file.filename}`);
            }
        }

        const blog = new Blog({
            name,
            description,
            deseases,
            remedies,
            cultivationTime,
            picture: mainPicture,
            pictureGallery: galleryImages,
            cultivationClimate,
            cultivationSoil,
            categoryName,
            pestisides,
            howToPlant
        });

        await blog.save();
        res.redirect('/admin/blogs');
    } catch (error) {
        console.error(error);
        res.redirect('/admin/error');
    }
};

const loadBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ createdAt: -1 });
        res.render('blogs', { blogs });
    } catch (error) {
        res.redirect('/admin/error');
    }

};


const deleteBlog = async (req, res) => {
    try {
        await Blog.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: 'Blog deleted successfully' });
    } catch (error) {       
        console.error(error);
        res.status(500).json({ success: false, message: 'Error deleting blog' });
    }
};

module.exports = {
    loadAddBlogPage,
    addBlog,
    loadBlogs,
    deleteBlog
};