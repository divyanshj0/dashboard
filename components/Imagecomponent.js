const TB_URL="https://demo.thingsboard.io"
export default function ImageComponent({title,imgsrc}){
    
    return(
        <div className="bg-white p-2 px-5 text-black h-full w-full shadow-sm border-gray-200 rounded-md">
            <div className="mt-2 text-2xl font-medium ">{title}</div>
            <img src={`${TB_URL}${imgsrc}`} alt={title} className="object-cover mt-5 max-h-[85%]"/>
        </div>
    );

} 