import mongoose from 'mongoose';

const BannerSchema = new mongoose.Schema({
    image: {
        type: Buffer,
        required: true
    },
    contentType: {
        type: String,
        required: true
    },
    filename: {
        type: String
    },
    url: {
        type: String
    },
    isSmall: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

export default mongoose.models.Banner || mongoose.model('Banner', BannerSchema);
