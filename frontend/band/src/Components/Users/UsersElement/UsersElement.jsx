import "./UsersElement.css";

export default function UsersElement({data}) {
  return (
    <>
      <div className="usersElement">
        <div className="usersElement-img">
            <img src={data.profilePhotoURL!=""?data.profilePhotoURL:"img/no-profile-photo.png"}/>
        </div>
        <div className="usersElement-content">
          <div className="usersElement-nick"><span>{data.nick}</span></div>
        </div>
      </div>
    </>
  );
}
