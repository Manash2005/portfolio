import { useEffect, useState } from "react"

function StatCard(props) {
  const [count, setCount] = useState(0);
  const numValue = parseInt(props.value) || 0;
  const suffix = props.value.replace(/[0-9]/g, '');

  useEffect(() => {
    let start = 0;
    const duration = 1000; // 1 second
    const increment = numValue / (duration / 50);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= numValue) {
        setCount(numValue);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 50);
    
    return () => clearInterval(timer);
  }, [numValue]);

  return (
    <div className="bg-secondary/10 hover:bg-secondary/20 p-4 rounded-xl text-center transition-all duration-300 w-full lg:w-2xs mb-5 lg:mb-0">
        {props.value && <div className="text-4xl font-bold text-foreground">{count}{suffix}</div>}
        {props.description && <div className="text-primary text-sm mt-2">{props.description}</div>}
    </div>
  )
}

export default StatCard