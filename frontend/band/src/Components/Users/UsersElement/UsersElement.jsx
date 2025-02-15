import "./UsersElement.css";

export default function Userselement() {
  return (
    <>
      <div className="usersElement">
        <div className="usersElement-img">
            <img src="img/no-profile-photo.png"/>
        </div>
        <div className="usersElement-content">
          <div className="usersElement-nick"><span>{"Nick"}</span></div>
        </div>
      </div>
    </>
  );
}
