export class User{
    public id: number;
    public  userId: string;
    public  firstName: string;
    public  lastName: string;
    public  username: string;
    public  email: string;
    public  profileImageUrl: string;
    public  lastLoginDateDisplay: Date;
    public  joinDate: Date;
    public  role: string; 
    public  authorities:[];
    public  active : boolean;
    public  notLocked: boolean;

    User(){
        this.firstName='';
        this.lastName='';
        this.username='';
        this.profileImageUrl = '';
        this.email='';
        this.active=false;
        this.notLocked= false;
        this.role='';
        this.authorities=[];
    }

}