export const pdfUpload = async (req, res) => {
    try {
        if(!req.file){
            return res.status(400).json({
                msg: "No PDF file provided"
            })
        }

        res.status(200).json({
            msg: "PDF uploaded successfully",
            file: {
                name: req.file.filename,
                size: req.file.size
            }
        })
    } catch (error) {
        return res.status(500).json({
            msg: `pdfUpload error ${error}`
        })
    }
}