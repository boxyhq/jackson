<script>
    import logo from '$lib/images/logo.png'
</script>

<nav>
    <div class='boxyhq-logo'>
        <div>
            <img src={logo} alt="BoxyHQ logo" width="40" height="40"/>
        </div>
       <div class='nav-title'>
        <h1>BoxyHQ Svelte SDK<h1>
       </div>
    </div>
    <div >
        <ul class='nav-links'>
            <li>
                <a href='/'>SDK</a> 
            </li>
            <li>
                <a href='/components'>Components</a> 
            </li>
        </ul>   
    </div>
</nav>    

<style>
nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 65px;
    font-size: 12px;
    padding: 5px 40px;
    margin-bottom: 15px;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02);
}

.boxyhq-logo {
  display: flex;
  justify-content: center;
  align-items: center;
}

.nav-links{
    display:flex;
}

.nav-title {
    font-size: 14px;
    font-weight: normal;
    margin-left: 15px;
}

ul {
    list-style-type: none;  
}

li a {
    text-decoration: none;
    padding:0 10px;
    font-size: 15px;
    font-family: sans-serif;
    cursor: pointer;
    color: black;
}
</style>    