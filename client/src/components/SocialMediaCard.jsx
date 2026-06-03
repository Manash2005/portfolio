function SocialMediaCard(props) {
  return (
    <div>
        <a 
          href={props.href} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center bg-secondary/20 text-foreground p-2 rounded-lg mx-3 hover:bg-foreground  hover:text-background hover:scale-102 hover:shadow-lg duration-300 transition-all"
        >
            <span className="text-3xl">{props.icon}</span>
        </a>
    </div>
  )
}

export default SocialMediaCard