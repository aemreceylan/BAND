import "./Panel.css";
export default function Panel({children}){
    return(<>
        <div id="panel">
        {children}
        </div>
    </>)
}